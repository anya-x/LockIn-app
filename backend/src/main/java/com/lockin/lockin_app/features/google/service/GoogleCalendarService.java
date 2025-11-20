package com.lockin.lockin_app.features.google.service;

import com.google.api.services.calendar.Calendar;
import com.lockin.lockin_app.features.google.entity.GoogleCalendarToken;
import com.lockin.lockin_app.features.google.repository.GoogleCalendarTokenRepository;
import com.lockin.lockin_app.features.tasks.entity.Task;
import com.lockin.lockin_app.features.tasks.entity.TaskStatus;
import com.lockin.lockin_app.features.tasks.repository.TaskRepository;
import com.lockin.lockin_app.features.users.entity.User;
import com.lockin.lockin_app.security.TokenEncryptionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.util.List;
import java.util.Map;

/**
 * Service for interacting with Google Calendar API.
 *
 * WIP: Basic structure
 * TODO: Implement createEvent
 * TODO: Implement listEvents
 * TODO: Error handling
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class GoogleCalendarService {

    private final GoogleCalendarTokenRepository tokenRepository;
    private final TokenEncryptionService encryptionService;
    private final TaskRepository taskRepository;
    private final GoogleOAuthService oauthService;

    /**
     * Create a calendar event from a task.
     *
     * WIP: Timezone handling is rough!
     */
    public String createEventFromTask(Task task, User user) {
        log.info("Creating calendar event for task: {}", task.getTitle());

        try {
            Calendar calendar = buildCalendarClient(user);

            // Create event from task
            com.google.api.services.calendar.model.Event event =
                new com.google.api.services.calendar.model.Event()
                    .setSummary(task.getTitle())
                    .setDescription(task.getDescription());

            // Set start/end times with timezone
            if (task.getDueDate() != null) {
                // Convert LocalDateTime to ZonedDateTime with timezone
                java.time.ZonedDateTime startZoned = task.getDueDate()
                    .atZone(java.time.ZoneId.systemDefault());
                java.time.ZonedDateTime endZoned = task.getDueDate().plusHours(1)
                    .atZone(java.time.ZoneId.systemDefault());

                // Convert ZonedDateTime to Google API DateTime with timezone
                com.google.api.client.util.DateTime startDateTime =
                    new com.google.api.client.util.DateTime(
                        startZoned.toInstant().toEpochMilli(),
                        java.util.TimeZone.getTimeZone(startZoned.getZone())
                    );

                com.google.api.client.util.DateTime endDateTime =
                    new com.google.api.client.util.DateTime(
                        endZoned.toInstant().toEpochMilli(),
                        java.util.TimeZone.getTimeZone(endZoned.getZone())
                    );

                com.google.api.services.calendar.model.EventDateTime start =
                    new com.google.api.services.calendar.model.EventDateTime()
                        .setDateTime(startDateTime)
                        .setTimeZone(startZoned.getZone().getId());

                com.google.api.services.calendar.model.EventDateTime end =
                    new com.google.api.services.calendar.model.EventDateTime()
                        .setDateTime(endDateTime)
                        .setTimeZone(endZoned.getZone().getId());

                event.setStart(start);
                event.setEnd(end);
            }

            // Add custom properties to link back to task
            event.setExtendedProperties(
                new com.google.api.services.calendar.model.Event.ExtendedProperties()
                    .setPrivate(Map.of(
                        "lockinTaskId", task.getId().toString(),
                        "source", "lockin"
                    ))
            );

            // Create event in Google Calendar
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

    /**
     * Build Google Calendar API client with user's access token.
     */
    public Calendar buildCalendarClient(User user) throws Exception {
        // Get token from database
        GoogleCalendarToken tokenEntity = tokenRepository.findByUser(user)
            .orElseThrow(() -> new RuntimeException("User has not connected Google Calendar"));

        if (!tokenEntity.getIsActive()) {
            throw new RuntimeException("Calendar connection is inactive");
        }

        // Check if token expired - DON'T refresh, throw exception
        if (tokenEntity.getTokenExpiresAt().isBefore(java.time.ZonedDateTime.now())) {
            log.warn("Access token expired for user {}", user.getId());
            throw new TokenExpiredException("Calendar connection expired - please reconnect");
        }

        // Decrypt access token
        String accessToken = encryptionService.decrypt(tokenEntity.getEncryptedAccessToken());

        // Build Google Calendar API client
        com.google.api.client.googleapis.auth.oauth2.GoogleCredential credential =
            new com.google.api.client.googleapis.auth.oauth2.GoogleCredential()
                .setAccessToken(accessToken);

        Calendar calendar = new Calendar.Builder(
            new com.google.api.client.http.javanet.NetHttpTransport(),
            com.google.api.client.json.gson.GsonFactory.getDefaultInstance(),
            credential
        )
        .setApplicationName("Lockin Task Manager")
        .build();

        log.info("Built Calendar API client for user {}", user.getId());

        return calendar;
    }

    /**
     * Fetch events from Google Calendar.
     *
     * WIP: Basic implementation
     * TODO: Handle pagination
     * TODO: Filter by date range
     */
    public java.util.List<com.google.api.services.calendar.model.Event> fetchRecentEvents(User user, int maxResults) {
        log.info("Fetching up to {} events for user {}", maxResults, user.getId());

        try {
            Calendar calendar = buildCalendarClient(user);

            // Fetch events from primary calendar
            // WIP: This gets ALL events, need to filter!
            com.google.api.services.calendar.model.Events events = calendar.events()
                .list("primary")
                .setMaxResults(maxResults)
                .setOrderBy("startTime")
                .setSingleEvents(true)
                .execute();

            java.util.List<com.google.api.services.calendar.model.Event> items = events.getItems();

            log.info("Fetched {} events from calendar", items.size());

            return items != null ? items : java.util.List.of();

        } catch (Exception e) {
            log.error("Failed to fetch calendar events", e);
            throw new RuntimeException("Failed to fetch calendar events: " + e.getMessage(), e);
        }
    }

    /**
     * Sync calendar events to tasks.
     * Creates tasks from calendar events that don't already exist.
     */
    @Transactional
    public int syncCalendarToTasks(User user) {
        log.info("Syncing calendar events to tasks for user {}", user.getId());

        try {
            List<com.google.api.services.calendar.model.Event> events = fetchRecentEvents(user, 100);
            int created = 0;

            for (com.google.api.services.calendar.model.Event event : events) {
                // Skip events we created (have our custom property)
                if (isLockinEvent(event)) {
                    log.debug("Skipping Lockin-created event: {}", event.getId());
                    continue;
                }

                // Check if we already have a task for this event
                if (taskRepository.existsByGoogleEventId(event.getId())) {
                    log.debug("Task already exists for event: {}", event.getId());
                    continue;
                }

                // Create task from event
                try {
                    Task task = createTaskFromEvent(event, user);
                    taskRepository.save(task);
                    created++;
                    log.info("Created task from calendar event: {}", event.getSummary());
                } catch (org.springframework.dao.DataIntegrityViolationException e) {
                    // Duplicate event ID - skip silently
                    log.debug("Event {} already has a task, skipping", event.getId());
                }
            }

            log.info("Created {} tasks from calendar events", created);
            return created;

        } catch (Exception e) {
            log.error("Failed to sync calendar to tasks", e);
            throw new RuntimeException("Calendar sync failed: " + e.getMessage(), e);
        }
    }

    private boolean isLockinEvent(com.google.api.services.calendar.model.Event event) {
        if (event.getExtendedProperties() == null) return false;
        Map<String, String> privateProps = event.getExtendedProperties().getPrivate();
        return privateProps != null && "lockin".equals(privateProps.get("source"));
    }

    private Task createTaskFromEvent(com.google.api.services.calendar.model.Event event, User user) {
        Task task = new Task();
        task.setUser(user);
        task.setTitle(event.getSummary() != null ? event.getSummary() : "Untitled Event");
        task.setDescription(event.getDescription());
        task.setGoogleEventId(event.getId());

        // Extract due date from event start time
        if (event.getStart() != null && event.getStart().getDateTime() != null) {
            long millis = event.getStart().getDateTime().getValue();
            task.setDueDate(ZonedDateTime.ofInstant(
                Instant.ofEpochMilli(millis),
                ZoneId.systemDefault()
            ).toLocalDateTime());
        }

        // Default to TODO status and not urgent/important
        task.setStatus(TaskStatus.TODO);
        task.setIsUrgent(false);
        task.setIsImportant(false);

        return task;
    }

    /**
     * Update calendar event when task changes.
     *
     * WIP: Only updates title/description/dates
     * TODO: Handle more fields
     */
    public void updateEventFromTask(Task task, User user) {
        if (task.getGoogleEventId() == null) {
            log.debug("Task {} has no linked event, skipping update", task.getId());
            return;
        }

        log.info("Updating calendar event {} for task {}", task.getGoogleEventId(), task.getId());

        try {
            Calendar calendar = buildCalendarClient(user);

            // Fetch existing event
            com.google.api.services.calendar.model.Event event = calendar.events()
                .get("primary", task.getGoogleEventId())
                .execute();

            // Update fields
            event.setSummary(task.getTitle());
            event.setDescription(task.getDescription());

            // Update dates if present
            if (task.getDueDate() != null) {
                java.time.ZonedDateTime startZoned = task.getDueDate()
                    .atZone(java.time.ZoneId.systemDefault());
                java.time.ZonedDateTime endZoned = task.getDueDate().plusHours(1)
                    .atZone(java.time.ZoneId.systemDefault());

                com.google.api.client.util.DateTime startDateTime =
                    new com.google.api.client.util.DateTime(
                        startZoned.toInstant().toEpochMilli(),
                        java.util.TimeZone.getTimeZone(startZoned.getZone())
                    );

                com.google.api.client.util.DateTime endDateTime =
                    new com.google.api.client.util.DateTime(
                        endZoned.toInstant().toEpochMilli(),
                        java.util.TimeZone.getTimeZone(endZoned.getZone())
                    );

                event.setStart(new com.google.api.services.calendar.model.EventDateTime()
                    .setDateTime(startDateTime)
                    .setTimeZone(startZoned.getZone().getId()));

                event.setEnd(new com.google.api.services.calendar.model.EventDateTime()
                    .setDateTime(endDateTime)
                    .setTimeZone(endZoned.getZone().getId()));
            }

            // Update event
            calendar.events().update("primary", task.getGoogleEventId(), event).execute();

            log.info("Calendar event updated successfully");

        } catch (Exception e) {
            log.error("Failed to update calendar event: {}", e.getMessage());
            // Silent fail - don't block task updates
        }
    }

    /**
     * Delete calendar event when task is deleted.
     */
    public void deleteEvent(String eventId, User user) {
        if (eventId == null) {
            return;
        }

        log.info("Deleting calendar event {}", eventId);

        try {
            Calendar calendar = buildCalendarClient(user);
            calendar.events().delete("primary", eventId).execute();

            log.info("Calendar event deleted successfully");

        } catch (Exception e) {
            log.error("Failed to delete calendar event: {}", e.getMessage());
            // Silent fail - don't block task deletion
        }
    }
}
