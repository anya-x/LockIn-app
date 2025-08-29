package com.lockin.lockin_app.features.google.service;

import com.google.api.client.googleapis.auth.oauth2.GoogleCredential;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import com.google.api.services.calendar.Calendar;
import com.lockin.lockin_app.features.google.entity.GoogleCalendarToken;
import com.lockin.lockin_app.features.google.repository.GoogleCalendarTokenRepository;
import com.lockin.lockin_app.features.tasks.entity.Task;
import com.lockin.lockin_app.features.users.entity.User;
import com.lockin.lockin_app.security.TokenEncryptionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.ZonedDateTime;

@Slf4j
@Service
@RequiredArgsConstructor
public class GoogleCalendarService {

    private final GoogleCalendarTokenRepository tokenRepository;
    private final TokenEncryptionService encryptionService;

    public String createEventFromTask(Task task, User user) {
        log.info("Creating calendar event for task: {}", task.getTitle());

        return "not-implemented";
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
}