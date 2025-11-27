package com.lockin.lockin_app.features.google.service;

import com.google.api.client.googleapis.auth.oauth2.GoogleCredential;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import com.google.api.client.util.DateTime;
import com.google.api.services.calendar.Calendar;
import com.google.api.services.calendar.model.Event;
import com.google.api.services.calendar.model.EventDateTime;
import com.lockin.lockin_app.features.google.entity.GoogleCalendarToken;
import com.lockin.lockin_app.features.google.repository.GoogleCalendarTokenRepository;
import com.lockin.lockin_app.features.tasks.entity.Task;
import com.lockin.lockin_app.features.users.entity.User;
import com.lockin.lockin_app.security.TokenEncryptionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.util.Map;
import java.util.TimeZone;

/**
 * Service for interacting with Google Calendar API.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class GoogleCalendarService {

    private final GoogleCalendarTokenRepository tokenRepository;
    private final TokenEncryptionService encryptionService;

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
                TimeZone timeZone = TimeZone.getTimeZone(zoneId);
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

                // Create DateTime with timezone (FIXED!)
                DateTime startDateTime = new DateTime(startMillis, timeZone);
                DateTime endDateTime = new DateTime(endMillis, timeZone);

                // Set timezone explicitly in EventDateTime
                EventDateTime start = new EventDateTime()
                        .setDateTime(startDateTime)
                        .setTimeZone(timeZoneStr);

                EventDateTime end = new EventDateTime()
                        .setDateTime(endDateTime)
                        .setTimeZone(timeZoneStr);

                event.setStart(start);
                event.setEnd(end);

                log.debug("Event times: {} to {} ({})", startDateTime, endDateTime, timeZoneStr);
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
}
