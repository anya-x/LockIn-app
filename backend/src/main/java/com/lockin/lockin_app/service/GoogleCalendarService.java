package com.lockin.lockin_app.service;

import com.google.api.client.googleapis.javanet.GoogleNetHttpTransport;
import com.google.api.client.http.HttpRequestInitializer;
import com.google.api.client.json.gson.GsonFactory;
import com.google.api.client.util.DateTime;
import com.google.api.services.calendar.Calendar;
import com.google.api.services.calendar.model.Event;
import com.google.api.services.calendar.model.EventDateTime;
import com.google.auth.http.HttpCredentialsAdapter;
import com.google.auth.oauth2.AccessToken;
import com.google.auth.oauth2.GoogleCredentials;
import com.lockin.lockin_app.entity.GoogleCalendarToken;
import com.lockin.lockin_app.entity.User;
import com.lockin.lockin_app.repository.GoogleCalendarTokenRepository;
import com.lockin.lockin_app.security.TokenEncryptionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.Date;
import java.util.TimeZone;

/**
 * Service for interacting with Google Calendar API.
 *
 * WIP: Implementing Calendar API client
 * TODO: Implement event creation
 * TODO: Implement event sync
 * TODO: Handle token refresh
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class GoogleCalendarService {

    private final GoogleCalendarTokenRepository tokenRepository;
    private final TokenEncryptionService encryptionService;

    /**
     * Build Google Calendar API client using user's stored tokens.
     *
     * WIP: Attempting to add automatic token refresh
     *
     * @param user User with calendar connection
     * @return Authenticated Calendar client
     */
    private Calendar buildCalendarClient(User user) {
        try {
            // Get user's tokens from database
            GoogleCalendarToken tokenEntity = tokenRepository.findByUser(user)
                .orElseThrow(() -> new RuntimeException("User has not connected calendar"));

            // Check if token is expired and needs refresh
            // BUG: This doesn't actually work! Token refresh is more complex than this
            if (tokenEntity.getTokenExpiresAt().isBefore(ZonedDateTime.now())) {
                log.warn("Access token expired for user {}, attempting refresh...", user.getEmail());
                // TODO: Implement token refresh
                // For now, just throw exception - user needs to reconnect
                throw new RuntimeException("Access token expired - please reconnect calendar");
            }

            // Decrypt access token
            String accessToken = encryptionService.decrypt(tokenEntity.getEncryptedAccessToken());

            // Build credentials with access token
            GoogleCredentials credentials = GoogleCredentials.create(
                new AccessToken(accessToken, Date.from(tokenEntity.getTokenExpiresAt().toInstant()))
            );

            HttpRequestInitializer requestInitializer = new HttpCredentialsAdapter(credentials);

            // Build Calendar client
            return new Calendar.Builder(
                GoogleNetHttpTransport.newTrustedTransport(),
                GsonFactory.getDefaultInstance(),
                requestInitializer
            )
                .setApplicationName("LockIn Task Manager")
                .build();

        } catch (Exception e) {
            log.error("Failed to build Calendar client for user {}", user.getEmail(), e);
            throw new RuntimeException("Failed to build Calendar client", e);
        }
    }

    /**
     * Attempt to refresh access token using refresh token.
     *
     * WIP: This is proving to be more complex than expected!
     * Google's OAuth refresh flow has weird edge cases.
     */
    private void refreshAccessToken(User user) {
        // TODO: Implement this
        // Need to:
        // 1. Get refresh token from database
        // 2. POST to Google OAuth token endpoint
        // 3. Get new access token
        // 4. Update database with new token and expiry
        // 5. Handle cases where refresh token is invalid/revoked
        //
        // This is WAY more complex than I thought...
        throw new UnsupportedOperationException("Token refresh not implemented yet");
    }

    /**
     * Create a Calendar event from a task.
     *
     * @param user User to create event for
     * @param title Event title
     * @param description Event description
     * @param startTime Event start time
     * @param durationMinutes Duration in minutes
     * @return Event ID from Google Calendar
     * @throws RuntimeException if calendar is not connected or token expired
     */
    public String createEventFromTask(User user, String title, String description,
                                      LocalDateTime startTime, int durationMinutes) {
        // Validation
        if (title == null || title.trim().isEmpty()) {
            throw new IllegalArgumentException("Event title cannot be empty");
        }
        if (startTime == null) {
            throw new IllegalArgumentException("Event start time cannot be null");
        }
        if (durationMinutes <= 0 || durationMinutes > 1440) {
            throw new IllegalArgumentException("Duration must be between 1 and 1440 minutes");
        }

        try {
            log.info("Creating calendar event for user {}: {}", user.getEmail(), title);

            // Get Calendar client (will throw if token expired)
            Calendar calendar = buildCalendarClient(user);

            // Create event object
            Event event = new Event()
                .setSummary(title)
                .setDescription(description);

            // FIXED: Include timezone to prevent wrong times!
            LocalDateTime endTime = startTime.plusMinutes(durationMinutes);
            TimeZone timeZone = TimeZone.getTimeZone(ZoneId.systemDefault());

            EventDateTime start = new EventDateTime()
                .setDateTime(new DateTime(
                    Date.from(startTime.atZone(ZoneId.systemDefault()).toInstant()),
                    timeZone
                ));

            EventDateTime end = new EventDateTime()
                .setDateTime(new DateTime(
                    Date.from(endTime.atZone(ZoneId.systemDefault()).toInstant()),
                    timeZone
                ));

            event.setStart(start);
            event.setEnd(end);

            // Insert event into primary calendar
            Event createdEvent = calendar.events()
                .insert("primary", event)
                .execute();

            log.info("Created calendar event with ID: {} for user {}",
                createdEvent.getId(), user.getEmail());

            return createdEvent.getId();

        } catch (Exception e) {
            log.error("Failed to create calendar event for user {}", user.getEmail(), e);
            throw new RuntimeException("Failed to create calendar event", e);
        }
    }

    /**
     * Sync tasks to calendar.
     *
     * WIP: Need to implement
     */
    public void syncTasksToCalendar(User user) {
        log.info("Syncing tasks to calendar for user {}", user.getEmail());

        // TODO: Get all incomplete tasks
        // TODO: Check which tasks already have calendar events
        // TODO: Create new events for tasks without events
        // TODO: Update existing events if task changed

        throw new UnsupportedOperationException("Not implemented yet");
    }

    /**
     * Check if user has active calendar connection.
     */
    public boolean isCalendarConnected(User user) {
        return tokenRepository.findByUser(user)
            .map(GoogleCalendarToken::getIsActive)
            .orElse(false);
    }
}
