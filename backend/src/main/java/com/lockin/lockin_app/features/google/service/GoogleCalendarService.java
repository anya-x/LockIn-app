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
     * WIP: Not implemented yet
     */
    public String createEventFromTask(Task task, User user) {
        log.info("Creating calendar event for task: {}", task.getTitle());

        // TODO: Get user's tokens
        // TODO: Build Calendar API client
        // TODO: Create event
        // TODO: Return event ID

        return "not-implemented";
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
}
