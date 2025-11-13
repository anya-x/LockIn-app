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
     * @param user User with calendar connection
     * @return Authenticated Calendar client
     */
    private Calendar buildCalendarClient(User user) {
        try {
            // Get user's tokens from database
            GoogleCalendarToken tokenEntity = tokenRepository.findByUser(user)
                .orElseThrow(() -> new RuntimeException("User has not connected calendar"));

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
     * Create a Calendar event from a task.
     *
     * @param user User to create event for
     * @param title Event title
     * @param description Event description
     * @param startTime Event start time
     * @param durationMinutes Duration in minutes
     * @return Event ID from Google Calendar
     */
    public String createEventFromTask(User user, String title, String description,
                                      LocalDateTime startTime, int durationMinutes) {
        try {
            log.info("Creating calendar event for user {}: {}", user.getEmail(), title);

            // Get Calendar client
            Calendar calendar = buildCalendarClient(user);

            // Create event object
            Event event = new Event()
                .setSummary(title)
                .setDescription(description);

            // BUG: Not including timezone here! Will cause events to be created in wrong time
            // Should be: new DateTime(Date.from(...), TimeZone.getTimeZone(ZoneId.systemDefault()))
            LocalDateTime endTime = startTime.plusMinutes(durationMinutes);

            EventDateTime start = new EventDateTime()
                .setDateTime(new DateTime(Date.from(startTime.atZone(ZoneId.systemDefault()).toInstant())));

            EventDateTime end = new EventDateTime()
                .setDateTime(new DateTime(Date.from(endTime.atZone(ZoneId.systemDefault()).toInstant())));

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
