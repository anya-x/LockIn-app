package com.lockin.lockin_app.service;

import com.lockin.lockin_app.features.users.entity.User;
import com.lockin.lockin_app.exception.ResourceNotFoundException;
import com.lockin.lockin_app.features.users.repository.UserRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;

@Service
@RequiredArgsConstructor
@Slf4j
public class StreakService {

    private final UserRepository userRepository;
    private final AnalyticsCalculationService analyticsService;

    @Transactional
    public void updateStreak(Long userId) {
        User user =
                userRepository
                        .findById(userId)
                        .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        LocalDate today = LocalDate.now();
        LocalDate lastActivity = user.getLastActivityDate();

        // today is productive (>30 min focus OR >1 task completed)
        var todayAnalytics = analyticsService.calculateDailyAnalytics(userId, today);
        boolean isProductiveDay =
                todayAnalytics.getFocusMinutes() >= 30 || todayAnalytics.getTasksCompleted() >= 1;

        if (!isProductiveDay) {
            log.debug("Not a productive day yet for user {}", userId);
            return;
        }

        if (lastActivity == null) {
            user.setCurrentStreak(1);
            user.setLongestStreak(1);
            user.setLastActivityDate(today);
            userRepository.save(user);
            log.info("Started first streak for user {}", userId);
            return;
        }

        if (lastActivity.equals(today)) {
            log.debug("Streak already updated today for user {}", userId);
            return;
        }

        if (lastActivity.equals(today.minusDays(1))) {
            int newStreak = user.getCurrentStreak() + 1;
            user.setCurrentStreak(newStreak);

            if (newStreak > user.getLongestStreak()) {
                user.setLongestStreak(newStreak);
                log.info("New longest streak achieved: {} days for user {}", newStreak, userId);
            }

            user.setLastActivityDate(today);
            userRepository.save(user);
            log.info("Streak continued: {} days for user {}", newStreak, userId);
            return;
        }

        if (lastActivity.isBefore(today.minusDays(1))) {
            log.info(
                    "Streak broken for user {}. Previous: {} days",
                    userId,
                    user.getCurrentStreak());
            user.setCurrentStreak(1);
            user.setLastActivityDate(today);
            userRepository.save(user);
        }
    }

    public StreakStats getStreakStats(Long userId) {
        User user =
                userRepository
                        .findById(userId)
                        .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        LocalDate today = LocalDate.now();
        LocalDate lastActivity = user.getLastActivityDate();

        int currentStreak = user.getCurrentStreak();

        if (lastActivity != null && lastActivity.isBefore(today.minusDays(1))) {
            currentStreak = 0;
        }

        return new StreakStats(currentStreak, user.getLongestStreak(), lastActivity);
    }

    public record StreakStats(
            Integer currentStreak, Integer longestStreak, LocalDate lastActivityDate) {}
}
