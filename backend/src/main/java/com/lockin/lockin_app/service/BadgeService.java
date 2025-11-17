package com.lockin.lockin_app.service;

import com.lockin.lockin_app.dto.BadgeDTO;
import com.lockin.lockin_app.dto.DailyAnalyticsDTO;
import com.lockin.lockin_app.entity.Badge;
import com.lockin.lockin_app.entity.BadgeType;
import com.lockin.lockin_app.entity.User;
import com.lockin.lockin_app.exception.ResourceNotFoundException;
import com.lockin.lockin_app.repository.BadgeRepository;
import com.lockin.lockin_app.repository.FocusSessionRepository;
import com.lockin.lockin_app.repository.UserRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class BadgeService {

    private final BadgeRepository badgeRepository;
    private final UserRepository userRepository;
    private final FocusSessionRepository focusSessionRepository;
    private final AnalyticsCalculationService analyticsService;
    private final com.lockin.lockin_app.repository.TaskRepository taskRepository;
    private final com.lockin.lockin_app.repository.GoalRepository goalRepository;

    @Transactional(readOnly = true)
    public List<BadgeDTO> getUserBadges(Long userId) {
        log.debug("Getting badges for user: {}", userId);
        return badgeRepository.findByUserIdOrderByEarnedAtDesc(userId).stream()
                .map(BadgeDTO::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional
    public List<BadgeDTO> checkAndAwardBadges(Long userId) {
        log.info("Checking badges for user: {}", userId);

        List<BadgeDTO> newBadges = new ArrayList<>();

        // Easy badges (check these first for quick wins)
        checkAndAward(userId, BadgeType.FIRST_STEPS, this::checkFirstSteps, newBadges);
        checkAndAward(userId, BadgeType.TASK_TERMINATOR, this::checkTaskTerminator, newBadges);
        checkAndAward(userId, BadgeType.POMODORO_100, this::checkPomodoro100, newBadges);

        // Medium badges
        checkAndAward(userId, BadgeType.WEEK_WARRIOR, this::checkWeekWarrior, newBadges);
        checkAndAward(userId, BadgeType.DEEP_WORK_MASTER, this::checkDeepWorkMaster, newBadges);
        checkAndAward(userId, BadgeType.FLOW_STATE, this::checkFlowState, newBadges);
        checkAndAward(userId, BadgeType.GOAL_CRUSHER, this::checkGoalCrusher, newBadges);
        checkAndAward(userId, BadgeType.EARLY_BIRD, this::checkEarlyBird, newBadges);

        // Hard badges (expensive checks - only if not already earned)
        checkAndAward(userId, BadgeType.ZEN_MODE, this::checkZenMode, newBadges);
        checkAndAward(userId, BadgeType.MONTH_MARATHONER, this::checkMonthMarathoner, newBadges);
        checkAndAward(userId, BadgeType.POMODORO_500, this::checkPomodoro500, newBadges);
        checkAndAward(userId, BadgeType.SUSTAINABLE_PACE, this::checkSustainablePace, newBadges);

        return newBadges;
    }

    private void checkAndAward(Long userId, BadgeType badgeType,
                                java.util.function.Function<Long, Boolean> checker,
                                List<BadgeDTO> newBadges) {
        // Skip if already earned
        if (badgeRepository.existsByUserIdAndBadgeType(userId, badgeType)) {
            return;
        }

        if (checker.apply(userId)) {
            BadgeDTO badge = awardBadge(userId, badgeType);
            if (badge != null) newBadges.add(badge);
        }
    }

    private boolean checkPomodoro100(Long userId) {
        long totalSessions = focusSessionRepository.countByUserIdAndCompleted(userId, true);
        return totalSessions >= 100;
    }

    private boolean checkWeekWarrior(Long userId) {
        LocalDate today = LocalDate.now();
        LocalDate weekAgo = today.minusDays(6);

        for (int i = 0; i < 7; i++) {
            LocalDate date = weekAgo.plusDays(i);
            DailyAnalyticsDTO analytics = analyticsService.calculateDailyAnalytics(userId, date);

            // Not productive if less than 30 min focus OR less than 1 task completed
            if (analytics.getFocusMinutes() < 30 && analytics.getTasksCompleted() < 1) {
                return false;
            }
        }
        return true;
    }

    private boolean checkDeepWorkMaster(Long userId) {
        LocalDate today = LocalDate.now();
        LocalDate weekAgo = today.minusDays(6);

        for (int i = 0; i < 7; i++) {
            LocalDate date = weekAgo.plusDays(i);
            DailyAnalyticsDTO analytics = analyticsService.calculateDailyAnalytics(userId, date);

            // Need 4+ hours (240 minutes) per day
            if (analytics.getFocusMinutes() < 240) {
                return false;
            }
        }
        return true;
    }

    private boolean checkZenMode(Long userId) {
        LocalDate today = LocalDate.now();
        LocalDate monthAgo = today.minusDays(29);

        for (int i = 0; i < 30; i++) {
            LocalDate date = monthAgo.plusDays(i);
            DailyAnalyticsDTO analytics = analyticsService.calculateDailyAnalytics(userId, date);

            // Burnout score should be low (< 40 out of 100)
            if (analytics.getBurnoutRiskScore() >= 40) {
                return false;
            }
        }
        return true;
    }

    // Easy badge checks
    private boolean checkFirstSteps(Long userId) {
        long completedTasks = taskRepository.countByUserIdAndStatus(
                userId, com.lockin.lockin_app.entity.TaskStatus.DONE);
        return completedTasks >= 1;
    }

    private boolean checkTaskTerminator(Long userId) {
        long completedTasks = taskRepository.countByUserIdAndStatus(
                userId, com.lockin.lockin_app.entity.TaskStatus.DONE);
        return completedTasks >= 100;
    }

    private boolean checkPomodoro500(Long userId) {
        long totalSessions = focusSessionRepository.countByUserIdAndCompleted(userId, true);
        return totalSessions >= 500;
    }

    // Medium badge checks
    private boolean checkFlowState(Long userId) {
        LocalDate today = LocalDate.now();
        DailyAnalyticsDTO analytics = analyticsService.calculateDailyAnalytics(userId, today);
        // 5+ hours = 300+ minutes
        return analytics.getFocusMinutes() >= 300;
    }

    private boolean checkGoalCrusher(Long userId) {
        long completedGoals = goalRepository.countByUserIdAndCompleted(userId, true);
        return completedGoals >= 10;
    }

    private boolean checkEarlyBird(Long userId) {
        LocalDate today = LocalDate.now();
        LocalDate weekAgo = today.minusDays(6);

        for (int i = 0; i < 7; i++) {
            LocalDate date = weekAgo.plusDays(i);
            DailyAnalyticsDTO analytics = analyticsService.calculateDailyAnalytics(userId, date);

            // Check if morning focus (before 8 AM) was significant
            // Morning is 00:00 - 11:59, so we check if morning had activity
            if (analytics.getMorningFocusMinutes() < 30) {
                return false;
            }
        }
        return true;
    }

    // Hard badge checks
    private boolean checkMonthMarathoner(Long userId) {
        LocalDate today = LocalDate.now();
        LocalDate monthAgo = today.minusDays(29);

        for (int i = 0; i < 30; i++) {
            LocalDate date = monthAgo.plusDays(i);
            DailyAnalyticsDTO analytics = analyticsService.calculateDailyAnalytics(userId, date);

            // Not productive if less than 30 min focus OR less than 1 task completed
            if (analytics.getFocusMinutes() < 30 && analytics.getTasksCompleted() < 1) {
                return false;
            }
        }
        return true;
    }

    private boolean checkSustainablePace(Long userId) {
        LocalDate today = LocalDate.now();
        LocalDate twoWeeksAgo = today.minusDays(13);

        for (int i = 0; i < 14; i++) {
            LocalDate date = twoWeeksAgo.plusDays(i);
            DailyAnalyticsDTO analytics = analyticsService.calculateDailyAnalytics(userId, date);

            // 5-6 hours = 300-360 minutes
            if (analytics.getFocusMinutes() < 240 || analytics.getFocusMinutes() > 360) {
                return false;
            }
        }
        return true;
    }

    private BadgeDTO awardBadge(Long userId, BadgeType badgeType) {
        // Check if already awarded
        if (badgeRepository.existsByUserIdAndBadgeType(userId, badgeType)) {
            log.debug("Badge {} already awarded to user {}", badgeType, userId);
            return null;
        }

        User user = userRepository
                .findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        Badge badge = new Badge();
        badge.setUser(user);
        badge.setBadgeType(badgeType);
        badge.setName(badgeType.getDisplayName());
        badge.setDescription(badgeType.getDescription());
        badge.setIcon(badgeType.getIcon());

        Badge saved = badgeRepository.save(badge);
        log.info("Awarded badge {} to user {}", badgeType, userId);

        return BadgeDTO.fromEntity(saved);
    }
}
