package com.lockin.lockin_app.service;

import com.lockin.lockin_app.entity.User;
import com.lockin.lockin_app.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;

/**
 * Service for tracking user productivity streaks
 * A productive day is defined as: >30 minutes focus time OR >1 task completed
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class StreakService {

    private final UserRepository userRepository;
    private final AnalyticsCalculationService analyticsService;

    /**
     * Update user streak based on today's activity
     * Should be called when a user completes a task or focus session
     */
    @Transactional
    public void updateStreak(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        LocalDate today = LocalDate.now();
        LocalDate lastActivity = user.getLastActivityDate();

        // Check if today is productive (>30 min focus OR >1 task completed)
        var todayAnalytics = analyticsService.calculateDailyAnalytics(userId, today);
        boolean isProductiveDay = todayAnalytics.getFocusMinutes() >= 30 ||
                todayAnalytics.getTasksCompleted() >= 1;

        if (!isProductiveDay) {
            log.debug("Not a productive day yet for user {}", userId);
            return; // Don't update streak for unproductive days
        }

        // First productive day ever
        if (lastActivity == null) {
            user.setCurrentStreak(1);
            user.setLongestStreak(1);
            user.setLastActivityDate(today);
            userRepository.save(user);
            log.info("Started first streak for user {}", userId);
            return;
        }

        // Already counted today
        if (lastActivity.equals(today)) {
            log.debug("Streak already updated today for user {}", userId);
            return;
        }

        // Consecutive day (yesterday was last activity)
        if (lastActivity.equals(today.minusDays(1))) {
            int newStreak = user.getCurrentStreak() + 1;
            user.setCurrentStreak(newStreak);

            // Update longest streak if current streak is higher
            if (newStreak > user.getLongestStreak()) {
                user.setLongestStreak(newStreak);
                log.info("New longest streak achieved: {} days for user {}", newStreak, userId);
            }

            user.setLastActivityDate(today);
            userRepository.save(user);
            log.info("Streak continued: {} days for user {}", newStreak, userId);
            return;
        }

        // Streak broken (missed a day)
        if (lastActivity.isBefore(today.minusDays(1))) {
            log.info("Streak broken for user {}. Previous: {} days", userId, user.getCurrentStreak());
            user.setCurrentStreak(1); // Start new streak
            user.setLastActivityDate(today);
            userRepository.save(user);
        }
    }

    /**
     * Get user's current streak statistics
     */
    public StreakStats getStreakStats(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Check if streak is still active (was active yesterday or today)
        LocalDate today = LocalDate.now();
        LocalDate lastActivity = user.getLastActivityDate();

        int currentStreak = user.getCurrentStreak();

        // Streak is broken if last activity was more than 1 day ago
        if (lastActivity != null &&
                lastActivity.isBefore(today.minusDays(1))) {
            currentStreak = 0; // Streak is broken but not yet updated
        }

        return new StreakStats(
                currentStreak,
                user.getLongestStreak(),
                lastActivity
        );
    }

    /**
     * DTO for streak statistics
     */
    public record StreakStats(
            Integer currentStreak,
            Integer longestStreak,
            LocalDate lastActivityDate
    ) {}
}
