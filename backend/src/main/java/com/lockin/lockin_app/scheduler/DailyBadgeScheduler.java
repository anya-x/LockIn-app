package com.lockin.lockin_app.scheduler;

import com.lockin.lockin_app.entity.User;
import com.lockin.lockin_app.repository.UserRepository;
import com.lockin.lockin_app.service.BadgeService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class DailyBadgeScheduler {

    private final BadgeService badgeService;
    private final UserRepository userRepository;

    /**
     * Runs daily at 2 AM to check streak and consistency badges for all users
     */
    @Scheduled(cron = "0 0 2 * * *")
    public void checkDailyBadges() {
        log.info("Starting daily badge check for all users");

        List<User> users = userRepository.findAll();
        int badgesAwarded = 0;

        for (User user : users) {
            try {
                // Check streak-based badges (Week Warrior, Month Marathoner, etc.)
                var newBadges = badgeService.checkAndAwardBadges(user.getId());
                badgesAwarded += newBadges.size();

                if (!newBadges.isEmpty()) {
                    log.info("Awarded {} badges to user {}", newBadges.size(), user.getId());
                }
            } catch (Exception e) {
                log.error("Error checking badges for user {}: {}", user.getId(), e.getMessage());
            }
        }

        log.info("Daily badge check completed. Awarded {} badges to {} users",
                badgesAwarded, users.size());
    }
}
