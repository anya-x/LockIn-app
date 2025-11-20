package com.lockin.lockin_app.features.google.service;

import com.google.api.services.calendar.Calendar;
import com.lockin.lockin_app.features.google.entity.GoogleCalendarToken;
import com.lockin.lockin_app.features.google.repository.GoogleCalendarTokenRepository;
import com.lockin.lockin_app.features.tasks.entity.Task;
import com.lockin.lockin_app.features.users.entity.User;
import com.lockin.lockin_app.security.TokenEncryptionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

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

        // Check if token expired
        if (tokenEntity.getTokenExpiresAt().isBefore(java.time.ZonedDateTime.now())) {
            log.warn("Access token expired for user {}", user.getId());
            // TODO: Implement token refresh!
            throw new RuntimeException("Access token expired - please reconnect calendar");
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
}
