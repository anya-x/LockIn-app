package com.lockin.lockin_app.service;

import com.lockin.lockin_app.entity.User;
import com.lockin.lockin_app.entity.UserAchievement;
import com.lockin.lockin_app.repository.FocusSessionRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import org.springframework.stereotype.Service;

import java.time.ZonedDateTime;

@Slf4j
@Service
@RequiredArgsConstructor
public class AchievementService {

    private final FocusSessionRepository focusSessionRepository;

    public void checkAchievements(User user) {
        // Check '100 Pomodoros' badge
        long sessionCount = focusSessionRepository.findByUserIdOrderByStartedAtDesc(user.getId()).size();
        if (sessionCount >= 100) {
            log.info("User {} earned '100 Pomodoros' achievement!", user.getEmail());
            // awardAchievement(user, "century_club");
        }

        // Check 'Week Warrior' (7 consecutive days)
        // TODO: Implement consecutive days check
        // boolean sevenDayStreak = checkConsecutiveDays(user, 7);

        // Check 'Deep Work Master' (4+ hours focus/day for week)
        // TODO: Implement deep work check

        log.debug("Achievement check completed for user {}", user.getId());
    }

    private void awardAchievement(User user, String achievementId) {
        UserAchievement achievement = new UserAchievement();
        achievement.setUser(user);
        achievement.setAchievementId(achievementId);
        achievement.setEarnedAt(ZonedDateTime.now());
        // Save achievement
        log.info("Awarded {} to user {}", achievementId, user.getId());
    }
}
