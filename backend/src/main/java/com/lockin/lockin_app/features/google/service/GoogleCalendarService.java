package com.lockin.lockin_app.features.google.service;

import com.google.api.client.googleapis.auth.oauth2.GoogleCredential;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import com.google.api.client.util.DateTime;
import com.google.api.services.calendar.Calendar;
import com.google.api.services.calendar.model.Event;
import com.google.api.services.calendar.model.EventDateTime;
import com.google.api.services.calendar.model.Events;
import com.lockin.lockin_app.features.google.entity.GoogleCalendarToken;
import com.lockin.lockin_app.features.google.repository.GoogleCalendarTokenRepository;
import com.lockin.lockin_app.features.tasks.entity.Task;
import com.lockin.lockin_app.features.tasks.entity.TaskStatus;
import com.lockin.lockin_app.features.tasks.repository.TaskRepository;
import com.lockin.lockin_app.features.users.entity.User;
import com.lockin.lockin_app.security.TokenEncryptionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class GoogleCalendarService {

    private final GoogleCalendarTokenRepository tokenRepository;
    private final TokenEncryptionService encryptionService;
    private final TaskRepository taskRepository;

    public String createEventFromTask(Task task, User user) {
        log.info("Creating calendar event for task: {}", task.getTitle());

        try {
            Calendar calendar = buildCalendarClient(user);

            Event event = new Event()
                    .setSummary(task.getTitle())
                    .setDescription(task.getDescription());

            if (task.getDueDate() != null) {
                ZoneId zoneId = ZoneId.systemDefault();
                String timeZoneStr = zoneId.getId();

                long startMillis = task.getDueDate()
                                       .atZone(zoneId)
                                       .toInstant()
                                       .toEpochMilli();

                long endMillis = task.getDueDate()
                                     .plusHours(1)
                                     .atZone(zoneId)
                                     .toInstant()
                                     .toEpochMilli();

                EventDateTime start = new EventDateTime()
                        .setDateTime(new DateTime(startMillis))
                        .setTimeZone(timeZoneStr);

                EventDateTime end = new EventDateTime()
                        .setDateTime(new DateTime(endMillis))
                        .setTimeZone(timeZoneStr);

                event.setStart(start);
                event.setEnd(end);
            }

            event.setExtendedProperties(
                    new Event.ExtendedProperties()
                            .setPrivate(Map.of(
                                    "lockinTaskId", task.getId().toString(),
                                    "source", "lockin"
                            ))
            );

            event = calendar.events()
                            .insert("primary", event)
                            .execute();

            log.info("Calendar event created: {}", event.getId());

            return event.getId();

        } catch (Exception e) {
            log.error("Failed to create calendar event", e);
            throw new RuntimeException("Failed to create calendar event: " + e.getMessage(), e);
        }
    }

    public Calendar buildCalendarClient(User user) throws Exception {
        GoogleCalendarToken tokenEntity = tokenRepository.findByUser(user)
                                                         .orElseThrow(() -> new RuntimeException("User has not connected Google Calendar"));

        if (!tokenEntity.getIsActive()) {
            throw new RuntimeException("Calendar connection is inactive");
        }

        if (tokenEntity.getTokenExpiresAt().isBefore(ZonedDateTime.now())) {
            log.warn("Access token expired for user {}", user.getId());
            throw new RuntimeException("Access token expired - please reconnect calendar");
        }

        String accessToken = encryptionService.decrypt(tokenEntity.getEncryptedAccessToken());

        @SuppressWarnings("deprecation")
        GoogleCredential credential = new GoogleCredential().setAccessToken(accessToken);

        Calendar calendar = new Calendar.Builder(
                new NetHttpTransport(),
                GsonFactory.getDefaultInstance(),
                credential
        )
                .setApplicationName("Lockin Task Manager")
                .build();

        log.info("Built Calendar API client for user {}", user.getId());

        return calendar;
    }

    public boolean isCalendarConnected(User user) {
        return tokenRepository.findByUser(user)
                              .map(GoogleCalendarToken::getIsActive)
                              .orElse(false);
    }

    public List<Event> fetchRecentEvents(User user, int maxResults) {
        log.info("Fetching up to {} events for user {}", maxResults, user.getId());

        try {
            Calendar calendar = buildCalendarClient(user);

            Events events = calendar.events()
                                    .list("primary")
                                    .setMaxResults(maxResults)
                                    .setOrderBy("startTime")
                                    .setSingleEvents(true)
                                    .execute();

            List<Event> items = events.getItems();

            log.info("Fetched {} events from calendar", items != null ? items.size() : 0);

            return items != null ? items : Collections.emptyList();

        } catch (Exception e) {
            log.error("Failed to fetch calendar events", e);
            throw new RuntimeException("Failed to fetch calendar events: " + e.getMessage(), e);
        }
    }

    @Transactional
    public int syncCalendarToTasks(User user) {
        log.info("Syncing calendar events to tasks for user {}", user.getId());

        try {
            List<Event> events = fetchRecentEvents(user, 100);
            int created = 0;

            for (Event event : events) {
                if (isLockinEvent(event)) {
                    log.debug("Skipping Lockin-created event: {}", event.getId());
                    continue;
                }

                if (taskRepository.existsByGoogleEventId(event.getId())) {
                    log.debug("Task already exists for event: {}", event.getId());
                    continue;
                }

                Task task = createTaskFromEvent(event, user);
                try {
                    taskRepository.save(task);
                    created++;
                    log.info("Created task from calendar event: {}", event.getSummary());
                } catch (DataIntegrityViolationException e) {
                    log.debug("Event {} already has a task (caught by constraint), skipping", event.getId());
                }
            }

            log.info("Created {} tasks from calendar events", created);
            return created;

        } catch (Exception e) {
            log.error("Failed to sync calendar to tasks", e);
            throw new RuntimeException("Calendar sync failed: " + e.getMessage(), e);
        }
    }

    private boolean isLockinEvent(Event event) {
        if (event.getExtendedProperties() == null) return false;
        Map<String, String> privateProps = event.getExtendedProperties().getPrivate();
        return privateProps != null && "lockin".equals(privateProps.get("source"));
    }

    private Task createTaskFromEvent(Event event, User user) {
        Task task = new Task();
        task.setUser(user);
        task.setTitle(event.getSummary() != null ? event.getSummary() : "Untitled Event");
        task.setDescription(event.getDescription());
        task.setGoogleEventId(event.getId());

        if (event.getStart() != null && event.getStart().getDateTime() != null) {
            long millis = event.getStart().getDateTime().getValue();
            task.setDueDate(LocalDateTime.ofInstant(
                    Instant.ofEpochMilli(millis),
                    ZoneId.systemDefault()
            ));
        }

        task.setStatus(TaskStatus.TODO);
        task.setIsUrgent(false);
        task.setIsImportant(false);

        return task;
    }

    public Map<String, Object> getConnectionStatus(User user) {
        Map<String, Object> status = new HashMap<>();

        Optional<GoogleCalendarToken> optionalToken = tokenRepository.findByUser(user);

        if (optionalToken.isEmpty()) {
            status.put("connected", false);
            return status;
        }

        GoogleCalendarToken token = optionalToken.get();
        status.put("connected", token.getIsActive());
        status.put("connectedAt", token.getConnectedAt());
        status.put("lastSyncAt", token.getLastSyncAt());
        status.put("tokenExpiresAt", token.getTokenExpiresAt());

        boolean isExpired = token.getTokenExpiresAt().isBefore(ZonedDateTime.now());
        status.put("isExpired", isExpired);

        if (isExpired) {
            status.put("message", "Connection expired - please reconnect");
        }

        return status;
    }

    @Transactional
    public void disconnectCalendar(User user) {
        log.info("Disconnecting calendar for user {}", user.getId());

        tokenRepository.findByUser(user).ifPresent(token -> {
            tokenRepository.delete(token);
            log.info("Deleted calendar token for user {}", user.getId());
        });
    }
}