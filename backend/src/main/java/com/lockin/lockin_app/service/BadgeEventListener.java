package com.lockin.lockin_app.service;

import com.lockin.lockin_app.entity.BadgeType;
import com.lockin.lockin_app.entity.TaskStatus;
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
        long completedTasks =
                taskRepository.countByUserIdAndStatus(userId, TaskStatus.COMPLETED);

        // Check First Steps badge (1 task)
        if (completedTasks >= 1
                && !badgeRepository.existsByUserIdAndBadgeType(
                        userId, BadgeType.FIRST_STEPS)) {
            badgeService.awardBadge(userId, BadgeType.FIRST_STEPS);
            log.info("Awarded First Steps badge to user {}", userId);
        }

        // Check Task Warrior badge (10 tasks)
        if (completedTasks >= 10
                && !badgeRepository.existsByUserIdAndBadgeType(
                        userId, BadgeType.TASK_WARRIOR)) {
            badgeService.awardBadge(userId, BadgeType.TASK_WARRIOR);
            log.info("Awarded Task Warrior badge to user {}", userId);
        }

        // Check Task Master badge (50 tasks)
        if (completedTasks >= 50
                && !badgeRepository.existsByUserIdAndBadgeType(
                        userId, BadgeType.TASK_MASTER)) {
            badgeService.awardBadge(userId, BadgeType.TASK_MASTER);
            log.info("Awarded Task Master badge to user {}", userId);
        }

        // Check Task Terminator badge (100 tasks)
        if (completedTasks >= 100
                && !badgeRepository.existsByUserIdAndBadgeType(
                        userId, BadgeType.TASK_TERMINATOR)) {
            badgeService.awardBadge(userId, BadgeType.TASK_TERMINATOR);
            log.info("Awarded Task Terminator badge to user {}", userId);
        }
    }

    @Async
    @EventListener
    public void onPomodoroCompleted(PomodoroCompletedEvent event) {
        log.debug("Pomodoro completed event received for user {}", event.getUserId());

        Long userId = event.getUserId();
        long totalSessions = focusSessionRepository.countByUserIdAndCompleted(userId, true);

        // Check Focus Novice badge (1 pomodoro)
        if (totalSessions >= 1
                && !badgeRepository.existsByUserIdAndBadgeType(
                        userId, BadgeType.FOCUS_NOVICE)) {
            badgeService.awardBadge(userId, BadgeType.FOCUS_NOVICE);
            log.info("Awarded Focus Novice badge to user {}", userId);
        }

        // Check Focus Apprentice badge (25 pomodoros)
        if (totalSessions >= 25
                && !badgeRepository.existsByUserIdAndBadgeType(
                        userId, BadgeType.FOCUS_APPRENTICE)) {
            badgeService.awardBadge(userId, BadgeType.FOCUS_APPRENTICE);
            log.info("Awarded Focus Apprentice badge to user {}", userId);
        }

        // Check Pomodoro 100 badge
        if (totalSessions >= 100
                && !badgeRepository.existsByUserIdAndBadgeType(
                        userId, BadgeType.POMODORO_100)) {
            badgeService.awardBadge(userId, BadgeType.POMODORO_100);
            log.info("Awarded 100 Pomodoros badge to user {}", userId);
        }

        // Check Pomodoro 500 badge
        if (totalSessions >= 500
                && !badgeRepository.existsByUserIdAndBadgeType(
                        userId, BadgeType.POMODORO_500)) {
            badgeService.awardBadge(userId, BadgeType.POMODORO_500);
            log.info("Awarded 500 Pomodoros badge to user {}", userId);
        }
    }

    @Async
    @EventListener
    public void onGoalCompleted(GoalCompletedEvent event) {
        log.debug("Goal completed event received for user {}", event.getUserId());

        Long userId = event.getUserId();
        long completedGoals = goalRepository.countByUserIdAndCompleted(userId, true);

        // Check Goal Setter badge (1 goal)
        if (completedGoals >= 1
                && !badgeRepository.existsByUserIdAndBadgeType(
                        userId, BadgeType.GOAL_SETTER)) {
            badgeService.awardBadge(userId, BadgeType.GOAL_SETTER);
            log.info("Awarded Goal Setter badge to user {}", userId);
        }

        // Check Goal Achiever badge (5 goals)
        if (completedGoals >= 5
                && !badgeRepository.existsByUserIdAndBadgeType(
                        userId, BadgeType.GOAL_ACHIEVER)) {
            badgeService.awardBadge(userId, BadgeType.GOAL_ACHIEVER);
            log.info("Awarded Goal Achiever badge to user {}", userId);
        }

        // Check Goal Crusher badge (10 goals)
        if (completedGoals >= 10
                && !badgeRepository.existsByUserIdAndBadgeType(
                        userId, BadgeType.GOAL_CRUSHER)) {
            badgeService.awardBadge(userId, BadgeType.GOAL_CRUSHER);
            log.info("Awarded Goal Crusher badge to user {}", userId);
        }
    }
}
