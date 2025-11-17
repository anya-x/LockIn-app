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

        // Check each badge type
        if (checkPomodoro100(userId)) {
            BadgeDTO badge = awardBadge(userId, BadgeType.POMODORO_100);
            if (badge != null) newBadges.add(badge);
        }

        if (checkWeekWarrior(userId)) {
            BadgeDTO badge = awardBadge(userId, BadgeType.WEEK_WARRIOR);
            if (badge != null) newBadges.add(badge);
        }

        if (checkDeepWorkMaster(userId)) {
            BadgeDTO badge = awardBadge(userId, BadgeType.DEEP_WORK_MASTER);
            if (badge != null) newBadges.add(badge);
        }

        if (checkZenMode(userId)) {
            BadgeDTO badge = awardBadge(userId, BadgeType.ZEN_MODE);
            if (badge != null) newBadges.add(badge);
        }

        return newBadges;
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
            if (analytics.getBurnoutScore() >= 40) {
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
