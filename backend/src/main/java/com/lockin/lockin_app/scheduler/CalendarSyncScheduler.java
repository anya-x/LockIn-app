package com.lockin.lockin_app.scheduler;

import com.lockin.lockin_app.features.google.entity.GoogleCalendarToken;
import com.lockin.lockin_app.features.google.repository.GoogleCalendarTokenRepository;
import com.lockin.lockin_app.features.google.service.GoogleCalendarService;
import com.lockin.lockin_app.features.notifications.service.NotificationService;
import com.lockin.lockin_app.features.users.entity.User;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.ZonedDateTime;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class CalendarSyncScheduler {

    private final GoogleCalendarTokenRepository tokenRepository;
    private final GoogleCalendarService calendarService;
    private final NotificationService notificationService;

    @Scheduled(fixedRate = 15 * 60 * 1000)
    public void syncAllUsers() {
        log.info("Starting scheduled calendar sync for all users");

        List<GoogleCalendarToken> tokens = tokenRepository.findAll()
                                                          .stream()
                                                          .filter(GoogleCalendarToken::getIsActive)
                                                          .toList();

        log.info(
                "Found {} users with active calendar connections",
                tokens.size());

        int successCount = 0;
        int failCount = 0;

        for (GoogleCalendarToken token : tokens) {
            try {
                User user = token.getUser();

                if (token.getTokenExpiresAt().isBefore(ZonedDateTime.now())) {
                    log.warn(
                            "Token expired for user {}, skipping sync",
                            user.getId());
                    failCount++;
                    continue;
                }

                int created = calendarService.syncCalendarToTasks(user);

                token.setLastSyncAt(ZonedDateTime.now());
                tokenRepository.save(token);

                log.info(
                        "Synced calendar for user {}: {} new tasks",
                        user.getId(),
                        created);
                successCount++;

                // Send notification if new tasks were created
                if (created > 0) {
                    try {
                        notificationService.createNotification(
                                user,
                                "CALENDAR_SYNC",
                                "Calendar Sync Complete",
                                String.format("%d new task%s imported from Google Calendar",
                                        created, created > 1 ? "s" : ""),
                                "/tasks"
                        );
                    } catch (Exception e) {
                        log.warn("Failed to send calendar sync notification: {}", e.getMessage());
                    }
                }

            } catch (Exception e) {
                log.error(
                        "Failed to sync calendar for user {}: {}",
                        token.getUser().getId(),
                        e.getMessage());
                failCount++;
            }
        }

        log.info(
                "Calendar sync complete: {} success, {} failed",
                successCount,
                failCount);
    }
}

