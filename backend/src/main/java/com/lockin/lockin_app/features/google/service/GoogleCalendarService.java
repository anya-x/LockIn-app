package com.lockin.lockin_app.features.google.service;

import com.google.api.client.googleapis.auth.oauth2.GoogleCredential;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import com.google.api.client.util.DateTime;
import com.google.api.services.calendar.Calendar;
import com.google.api.services.calendar.model.Event;
import com.google.api.services.calendar.model.EventDateTime;
import com.google.api.services.calendar.model.Events;
import com.google.api.services.tasks.model.TaskList;
import com.google.api.services.tasks.model.TaskLists;
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
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

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

            DateTime now = new DateTime(System.currentTimeMillis());
            DateTime thirtyDaysFromNow = new DateTime(
                    System.currentTimeMillis() + (30L * 24 * 60 * 60 * 1000)
            );

            Events events = calendar.events()
                                    .list("primary")
                                    .setMaxResults(maxResults)
                                    .setTimeMin(now)
                                    .setTimeMax(thirtyDaysFromNow)
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


    public com.google.api.services.tasks.Tasks buildTasksClient(User user) throws Exception {
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

        com.google.api.services.tasks.Tasks tasks = new com.google.api.services.tasks.Tasks.Builder(
                new NetHttpTransport(),
                GsonFactory.getDefaultInstance(),
                credential
        )
                .setApplicationName("Lockin Task Manager")
                .build();

        log.info("Built Tasks API client for user {}", user.getId());
        return tasks;
    }

    @Transactional
    public int syncCalendarToTasks(User user) {
        log.info("Syncing Google Tasks to Lockin for user {}", user.getId());

        try {
            com.google.api.services.tasks.Tasks tasksClient = buildTasksClient(user);
            int created = 0;
            LocalDateTime now = LocalDateTime.now();
            LocalDateTime thirtyDaysFromNow = now.plusDays(30);

            TaskLists taskLists = tasksClient.tasklists().list().execute();

            if (taskLists.getItems() == null) {
                log.info("No task lists found");
                return 0;
            }

            for (TaskList taskList : taskLists.getItems()) {
                log.info("Processing task list: {}", taskList.getTitle());

                com.google.api.services.tasks.model.Tasks googleTasks = tasksClient.tasks()
                                                                                   .list(taskList.getId())
                                                                                   .setShowCompleted(false)
                                                                                   .setShowHidden(false)
                                                                                   .execute();

                if (googleTasks.getItems() == null) {
                    continue;
                }

                for (com.google.api.services.tasks.model.Task googleTask : googleTasks.getItems()) {
                    if (googleTask.getDue() == null) {
                        log.debug("Skipping task without due date: {}", googleTask.getTitle());
                        continue;
                    }

                    try {
                        long millis = DateTime.parseRfc3339(googleTask.getDue().toString()).getValue();
                        LocalDateTime dueDate = LocalDateTime.ofInstant(
                                Instant.ofEpochMilli(millis),
                                ZoneId.systemDefault()
                        );

                        if (dueDate.isBefore(now)) {
                            log.debug("Skipping past task: {}", googleTask.getTitle());
                            continue;
                        }

                        if (dueDate.isAfter(thirtyDaysFromNow)) {
                            log.debug("Skipping task too far in future: {}", googleTask.getTitle());
                            continue;
                        }
                    } catch (Exception e) {
                        log.warn("Failed to parse due date for task: {}", googleTask.getTitle());
                        continue;
                    }

                    if (taskRepository.existsByGoogleEventId(googleTask.getId())) {
                        log.debug("Task already exists: {}", googleTask.getTitle());
                        continue;
                    }

                    Task task = createTaskFromGoogleTask(googleTask, user);
                    try {
                        taskRepository.save(task);
                        created++;
                        log.info("Created task from Google Task: {}", googleTask.getTitle());
                    } catch (DataIntegrityViolationException e) {
                        log.debug("Task {} already exists (caught by constraint)", googleTask.getId());
                    }
                }
            }

            log.info("Imported {} tasks from Google Tasks", created);
            return created;

        } catch (Exception e) {
            log.error("Failed to sync Google Tasks", e);
            throw new RuntimeException("Google Tasks sync failed: " + e.getMessage(), e);
        }
    }

    private Task createTaskFromGoogleTask(com.google.api.services.tasks.model.Task googleTask, User user) {
        Task task = new Task();
        task.setUser(user);
        task.setTitle(googleTask.getTitle() != null ? googleTask.getTitle() : "Untitled Task");
        task.setDescription(googleTask.getNotes());
        task.setGoogleEventId(googleTask.getId());

        if (googleTask.getDue() != null) {
            try {
                long millis = DateTime.parseRfc3339(googleTask.getDue().toString()).getValue();
                task.setDueDate(LocalDateTime.ofInstant(
                        Instant.ofEpochMilli(millis),
                        ZoneId.systemDefault()
                ));
            } catch (Exception e) {
                log.warn("Failed to parse due date: {}", googleTask.getDue());
            }
        }

        task.setStatus(TaskStatus.TODO);
        task.setIsUrgent(false);
        task.setIsImportant(false);

        return task;
    }

    @SuppressWarnings("unused")
    private int importEventsAsTasks(User user) {
        log.info("Importing calendar events as tasks for user {}", user.getId());

        try {
            List<Event> events = fetchRecentEvents(user, 100);
            int created = 0;

            for (Event event : events) {
                if (event.getStart() == null || event.getStart().getDateTime() == null) {
                    log.debug("Skipping all-day event: {}", event.getSummary());
                    continue;
                }

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

        Optional<GoogleCalendarToken> tokenOpt = tokenRepository.findByUser(user);

        if (tokenOpt.isEmpty()) {
            status.put("connected", false);
            return status;
        }

        GoogleCalendarToken token = tokenOpt.get();
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
    public int syncTasksToGoogle(User user) {
        log.info("Syncing Lockin tasks to Google Tasks for user {}", user.getId());

        try {
            com.google.api.services.tasks.Tasks tasksClient = buildTasksClient(user);
            int created = 0;
            LocalDateTime sixtyDaysFromNow = LocalDateTime.now().plusDays(60);

            List<Task> tasksToSync = taskRepository.findTasksToSyncToGoogle(
                    user.getId(),
                    sixtyDaysFromNow
            );

            if (tasksToSync.isEmpty()) {
                log.info("No tasks to sync to Google");
                return 0;
            }

            TaskLists taskLists = tasksClient.tasklists().list().execute();
            String taskListId = "@default";
            if (taskLists.getItems() != null && !taskLists.getItems().isEmpty()) {
                taskListId = taskLists.getItems().get(0).getId();
            }

            for (Task task : tasksToSync) {
                try {
                    com.google.api.services.tasks.model.Task googleTask = createGoogleTaskFromLockin(task);
                    com.google.api.services.tasks.model.Task createdTask = tasksClient.tasks()
                                                                                      .insert(taskListId, googleTask)
                                                                                      .execute();

                    task.setGoogleEventId(createdTask.getId());
                    taskRepository.save(task);
                    created++;
                    log.info("Created Google Task from Lockin task: {}", task.getTitle());
                } catch (Exception e) {
                    log.warn("Failed to create Google Task for task {}: {}", task.getId(), e.getMessage());
                }
            }

            log.info("Exported {} tasks to Google Tasks", created);
            return created;

        } catch (Exception e) {
            log.error("Failed to sync tasks to Google", e);
            throw new RuntimeException("Google Tasks sync failed: " + e.getMessage(), e);
        }
    }

    private com.google.api.services.tasks.model.Task createGoogleTaskFromLockin(Task task) {
        com.google.api.services.tasks.model.Task googleTask = new com.google.api.services.tasks.model.Task();
        googleTask.setTitle(task.getTitle());
        googleTask.setNotes(task.getDescription());

        if (task.getDueDate() != null) {
            long millis = task.getDueDate().atZone(ZoneId.systemDefault()).toInstant().toEpochMilli();
            googleTask.setDue(new DateTime(millis).toStringRfc3339());
        }

        return googleTask;
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