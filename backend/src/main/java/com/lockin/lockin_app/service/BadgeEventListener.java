package com.lockin.lockin_app.service;

import com.lockin.lockin_app.dto.BadgeDTO;
import com.lockin.lockin_app.entity.BadgeType;
import com.lockin.lockin_app.event.GoalCompletedEvent;
import com.lockin.lockin_app.event.PomodoroCompletedEvent;
import com.lockin.lockin_app.event.TaskCompletedEvent;
import com.lockin.lockin_app.repository.BadgeRepository;
import com.lockin.lockin_app.repository.FocusSessionRepository;
import com.lockin.lockin_app.repository.GoalRepository;
import com.lockin.lockin_app.repository.TaskRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;

import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class BadgeEventListener {

    private final BadgeService badgeService;
    private final BadgeRepository badgeRepository;
    private final TaskRepository taskRepository;
    private final FocusSessionRepository focusSessionRepository;
    private final GoalRepository goalRepository;

    @Async
    @EventListener
    public void onTaskCompleted(TaskCompletedEvent event) {
        log.debug("Task completed event received for user {}", event.getUserId());

        Long userId = event.getUserId();

        // Check First Steps badge (1 task)
        if (!badgeRepository.existsByUserIdAndBadgeType(userId, BadgeType.FIRST_STEPS)) {
            long completedTasks = taskRepository.countByUserIdAndStatus(
                    userId, com.lockin.lockin_app.entity.TaskStatus.DONE);
            if (completedTasks >= 1) {
                badgeService.checkAndAwardBadges(userId);
                log.info("Awarded First Steps badge to user {}", userId);
            }
        }

        // Check Task Terminator badge (100 tasks)
        if (!badgeRepository.existsByUserIdAndBadgeType(userId, BadgeType.TASK_TERMINATOR)) {
            long completedTasks = taskRepository.countByUserIdAndStatus(
                    userId, com.lockin.lockin_app.entity.TaskStatus.DONE);
            if (completedTasks >= 100) {
                badgeService.checkAndAwardBadges(userId);
                log.info("Awarded Task Terminator badge to user {}", userId);
            }
        }
    }

    @Async
    @EventListener
    public void onPomodoroCompleted(PomodoroCompletedEvent event) {
        log.debug("Pomodoro completed event received for user {}", event.getUserId());

        Long userId = event.getUserId();

        // Check Pomodoro badges
        if (!badgeRepository.existsByUserIdAndBadgeType(userId, BadgeType.POMODORO_100)) {
            long totalSessions = focusSessionRepository.countByUserIdAndCompleted(userId, true);
            if (totalSessions >= 100) {
                badgeService.checkAndAwardBadges(userId);
                log.info("Awarded 100 Pomodoros badge to user {}", userId);
            }
        }

        if (!badgeRepository.existsByUserIdAndBadgeType(userId, BadgeType.POMODORO_500)) {
            long totalSessions = focusSessionRepository.countByUserIdAndCompleted(userId, true);
            if (totalSessions >= 500) {
                badgeService.checkAndAwardBadges(userId);
                log.info("Awarded 500 Pomodoros badge to user {}", userId);
            }
        }
    }

    @Async
    @EventListener
    public void onGoalCompleted(GoalCompletedEvent event) {
        log.debug("Goal completed event received for user {}", event.getUserId());

        Long userId = event.getUserId();

        // Check Goal Crusher badge (10 goals)
        if (!badgeRepository.existsByUserIdAndBadgeType(userId, BadgeType.GOAL_CRUSHER)) {
            long completedGoals = goalRepository.countByUserIdAndCompleted(userId, true);
            if (completedGoals >= 10) {
                badgeService.checkAndAwardBadges(userId);
                log.info("Awarded Goal Crusher badge to user {}", userId);
            }
        }
    }
}
