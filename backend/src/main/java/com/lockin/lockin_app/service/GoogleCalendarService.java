package com.lockin.lockin_app.service;

import com.lockin.lockin_app.entity.GoogleCalendarToken;
import com.lockin.lockin_app.entity.User;
import com.lockin.lockin_app.repository.GoogleCalendarTokenRepository;
import com.lockin.lockin_app.security.TokenEncryptionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

/**
 * Service for interacting with Google Calendar API.
 *
 * WIP: Basic structure
 * TODO: Implement Calendar API client creation
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
     * Create a Calendar event from a task.
     *
     * WIP: Need to implement
     */
    public void createEventFromTask(User user, String title, String description) {
        log.info("Creating calendar event for user {}: {}", user.getEmail(), title);

        // TODO: Get user's tokens
        // TODO: Build Calendar API client
        // TODO: Create event with proper timezone
        // TODO: Store event ID for sync

        throw new UnsupportedOperationException("Not implemented yet");
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
