package com.lockin.lockin_app.features.google.service;

import com.google.api.services.calendar.Calendar;
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
     *
     * WIP: Not implemented yet
     */
    private Calendar buildCalendarClient(User user) {
        // TODO: Get token from database
        // TODO: Decrypt access token
        // TODO: Check if expired (refresh if needed)
        // TODO: Build Calendar API client

        return null;
    }
}
