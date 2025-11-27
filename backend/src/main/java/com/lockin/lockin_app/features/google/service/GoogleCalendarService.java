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

/**
 * Service for interacting with Google Calendar API.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class GoogleCalendarService {

    private final GoogleCalendarTokenRepository tokenRepository;
    private final TokenEncryptionService encryptionService;
    private final TaskRepository taskRepository;

    /**
     * Create a calendar event from a task.
     */
    public String createEventFromTask(Task task, User user) {
        log.info("Creating calendar event for task: {}", task.getTitle());

        try {
            Calendar calendar = buildCalendarClient(user);

            // Create event from task
            Event event = new Event()
                    .setSummary(task.getTitle())
                    .setDescription(task.getDescription());

            // Set start/end times based on task due date
            if (task.getDueDate() != null) {
                // Use system default timezone (could be user preference in future)
                ZoneId zoneId = ZoneId.systemDefault();
                String timeZoneStr = zoneId.getId();

                // Convert LocalDateTime to epoch millis with timezone
                long startMillis = task.getDueDate()
                        .atZone(zoneId)
                        .toInstant()
                        .toEpochMilli();

                long endMillis = task.getDueDate()
                        .plusHours(1)
                        .atZone(zoneId)
                        .toInstant()
                        .toEpochMilli();

                // Create EventDateTime with timezone
                // DateTime(millis) creates UTC time, but EventDateTime.setTimeZone handles display
                EventDateTime start = new EventDateTime()
                        .setDateTime(new DateTime(startMillis))
                        .setTimeZone(timeZoneStr);

                EventDateTime end = new EventDateTime()
                        .setDateTime(new DateTime(endMillis))
                        .setTimeZone(timeZoneStr);

                event.setStart(start);
                event.setEnd(end);

                log.debug("Event times: {} to {} ({})", start.getDateTime(), end.getDateTime(), timeZoneStr);
            }

            // Add custom properties to link back to task
            event.setExtendedProperties(
                    new Event.ExtendedProperties()
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

        // Check if token expired
        if (tokenEntity.getTokenExpiresAt().isBefore(ZonedDateTime.now())) {
            log.warn("Access token expired for user {}", user.getId());
            // TODO: Implement token refresh!
            throw new RuntimeException("Access token expired - please reconnect calendar");
        }

        // Decrypt access token
        String accessToken = encryptionService.decrypt(tokenEntity.getEncryptedAccessToken());

        // Build Google Calendar API client
        // Note: GoogleCredential is deprecated but still works
        // TODO: Migrate to newer Google Auth Library
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

    /**
     * Check if user has connected their calendar.
     */
    public boolean isCalendarConnected(User user) {
        return tokenRepository.findByUser(user)
                .map(GoogleCalendarToken::getIsActive)
                .orElse(false);
    }

    /**
     * Fetch upcoming events from Google Calendar.
     * Only fetches events from now to 30 days in the future.
     */
    public List<Event> fetchRecentEvents(User user, int maxResults) {
        log.info("Fetching up to {} upcoming events for user {}", maxResults, user.getId());

        try {
            Calendar calendar = buildCalendarClient(user);

            // Only fetch events from now onwards (next 30 days)
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

            log.info("Fetched {} upcoming events from calendar", items != null ? items.size() : 0);

            return items != null ? items : Collections.emptyList();

        } catch (Exception e) {
            log.error("Failed to fetch calendar events", e);
            throw new RuntimeException("Failed to fetch calendar events: " + e.getMessage(), e);
        }
    }

    /**
     * Build Google Tasks API client with user's access token.
     */
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

    /**
     * Sync Google Tasks to Lockin tasks.
     * Imports:
     * - Incomplete tasks with future due dates (next 60 days)
     * - Incomplete tasks without a due date
     * Does NOT import calendar events.
     */
    @Transactional
    public int syncCalendarToTasks(User user) {
        log.info("Syncing Google Tasks to Lockin for user {}", user.getId());

        try {
            com.google.api.services.tasks.Tasks tasksClient = buildTasksClient(user);
            int created = 0;
            LocalDateTime now = LocalDateTime.now();
            LocalDateTime sixtyDaysFromNow = now.plusDays(60);

            // Get all task lists
            TaskLists taskLists = tasksClient.tasklists().list().execute();

            if (taskLists.getItems() == null) {
                log.info("No task lists found");
                return 0;
            }

            for (TaskList taskList : taskLists.getItems()) {
                log.info("Processing task list: {}", taskList.getTitle());

                // Get tasks from this list (only incomplete tasks)
                com.google.api.services.tasks.model.Tasks googleTasks = tasksClient.tasks()
                        .list(taskList.getId())
                        .setShowCompleted(false)
                        .setShowHidden(false)
                        .execute();

                if (googleTasks.getItems() == null) {
                    continue;
                }

                for (com.google.api.services.tasks.model.Task googleTask : googleTasks.getItems()) {
                    // Check due date if present
                    if (googleTask.getDue() != null) {
                        try {
                            long millis = DateTime.parseRfc3339(googleTask.getDue().toString()).getValue();
                            LocalDateTime dueDate = LocalDateTime.ofInstant(
                                    Instant.ofEpochMilli(millis),
                                    ZoneId.systemDefault()
                            );
                            // Skip past due dates
                            if (dueDate.isBefore(now)) {
                                log.debug("Skipping past task: {}", googleTask.getTitle());
                                continue;
                            }
                            // Skip tasks more than 60 days in the future
                            if (dueDate.isAfter(sixtyDaysFromNow)) {
                                log.debug("Skipping task too far in future: {}", googleTask.getTitle());
                                continue;
                            }
                        } catch (Exception e) {
                            log.warn("Failed to parse due date for task: {}", googleTask.getTitle());
                        }
                    }
                    // Tasks without due date are allowed (incomplete tasks)

                    // Skip if already imported
                    if (taskRepository.existsByGoogleEventId(googleTask.getId())) {
                        log.debug("Task already exists: {}", googleTask.getTitle());
                        continue;
                    }

                    // Create Lockin task from Google Task
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

        // Extract due date if present
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

    // Keeping this method for potential future use
    @SuppressWarnings("unused")
    private int importEventsAsTasks(User user) {
        log.info("Importing calendar events as tasks for user {}", user.getId());

        try {
            List<Event> events = fetchRecentEvents(user, 100);
            int created = 0;

            for (Event event : events) {
                // Skip all-day events (birthdays, holidays) - they have date but no dateTime
                if (event.getStart() == null || event.getStart().getDateTime() == null) {
                    log.debug("Skipping all-day event: {}", event.getSummary());
                    continue;
                }

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
                Task task = createTaskFromEvent(event, user);
                try {
                    taskRepository.save(task);
                    created++;
                    log.info("Created task from calendar event: {}", event.getSummary());
                } catch (DataIntegrityViolationException e) {
                    // Duplicate event ID - skip silently (partial unique index caught it)
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

        // Extract due date from event start time
        if (event.getStart() != null && event.getStart().getDateTime() != null) {
            long millis = event.getStart().getDateTime().getValue();
            task.setDueDate(LocalDateTime.ofInstant(
                    Instant.ofEpochMilli(millis),
                    ZoneId.systemDefault()
            ));
        }

        // Default to TODO status and not urgent/important
        task.setStatus(TaskStatus.TODO);
        task.setIsUrgent(false);
        task.setIsImportant(false);

        return task;
    }

    /**
     * Get connection status for frontend display.
     */
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

        // Check if token expired
        boolean isExpired = token.getTokenExpiresAt().isBefore(ZonedDateTime.now());
        status.put("isExpired", isExpired);

        if (isExpired) {
            status.put("message", "Connection expired - please reconnect");
        }

        return status;
    }

    /**
     * Disconnect user's calendar.
     * Removes stored tokens.
     */
    @Transactional
    public void disconnectCalendar(User user) {
        log.info("Disconnecting calendar for user {}", user.getId());

        tokenRepository.findByUser(user).ifPresent(token -> {
            tokenRepository.delete(token);
            log.info("Deleted calendar token for user {}", user.getId());
        });
    }
}
