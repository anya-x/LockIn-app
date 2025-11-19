package com.lockin.lockin_app.scheduler;

import com.lockin.lockin_app.entity.User;
import com.lockin.lockin_app.repository.UserRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

/**
 * Scheduler for managing user streaks.
 *
 * CRITICAL: Automatically breaks streaks when users miss a day.
 * Without this, streaks only update when users visit the app,
 * causing incorrect streak counts.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class StreakScheduler {

    private final UserRepository userRepository;

    /**
     * Check and break streaks for users who missed yesterday.
     *
     * Runs at 12:05 AM daily to give a 5-minute grace period after midnight.
     *
     * Logic:
     * - Find users whose lastActivityDate is before yesterday
     * - Set their currentStreak to 0 (but keep lastActivityDate for history)
     * - This fixes the bug where streaks don't break unless user visits app
     */
    @Scheduled(cron = "0 5 0 * * ?")
    @Transactional
    public void checkAndBreakStreaks() {
        log.info("Starting daily streak check");

        LocalDate yesterday = LocalDate.now().minusDays(1);

        // Find users who haven't been active recently but still have a streak
        List<User> usersWithBrokenStreaks = userRepository.findUsersWithBrokenStreaks(yesterday);

        if (usersWithBrokenStreaks.isEmpty()) {
            log.info("No streaks to break today");
            return;
        }

        int brokenCount = 0;
        for (User user : usersWithBrokenStreaks) {
            int oldStreak = user.getCurrentStreak();
            user.setCurrentStreak(0);
            brokenCount++;

            log.info("Broke streak for user {}: {} days (last activity: {})",
                    user.getId(), oldStreak, user.getLastActivityDate());
        }

        userRepository.saveAll(usersWithBrokenStreaks);

        log.info("Streak check complete. Broke {} streaks", brokenCount);
    }
}
