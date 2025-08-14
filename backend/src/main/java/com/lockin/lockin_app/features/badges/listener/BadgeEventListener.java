package com.lockin.lockin_app.features.badges.listener;

import com.lockin.lockin_app.features.badges.entity.BadgeType;
import com.lockin.lockin_app.features.badges.entity.BadgeType.BadgeCategory;
import com.lockin.lockin_app.features.badges.service.BadgeService;
import com.lockin.lockin_app.features.tasks.entity.TaskStatus;
import com.lockin.lockin_app.event.GoalCompletedEvent;
import com.lockin.lockin_app.event.PomodoroCompletedEvent;
import com.lockin.lockin_app.event.TaskCompletedEvent;
import com.lockin.lockin_app.features.badges.repository.BadgeRepository;
import com.lockin.lockin_app.features.focus_sessions.repository.FocusSessionRepository;
import com.lockin.lockin_app.features.goals.repository.GoalRepository;
import com.lockin.lockin_app.features.tasks.repository.TaskRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

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
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onTaskCompleted(TaskCompletedEvent event) {
        log.debug("Task completed event received for user {}", event.getUserId());

        Long userId = event.getUserId();
        long completedTasks = taskRepository.countByUserIdAndStatus(userId, TaskStatus.COMPLETED);

        checkAndAwardBadges(userId, completedTasks, BadgeCategory.TASK);
    }

    @Async
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onPomodoroCompleted(PomodoroCompletedEvent event) {
        log.debug("Pomodoro completed event received for user {}", event.getUserId());

        Long userId = event.getUserId();
        long totalSessions = focusSessionRepository.countByUserIdAndCompleted(userId, true);

        checkAndAwardBadges(userId, totalSessions, BadgeCategory.POMODORO);
    }

    @Async
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onGoalCompleted(GoalCompletedEvent event) {
        log.debug("Goal completed event received for user {}", event.getUserId());

        Long userId = event.getUserId();
        long completedGoals = goalRepository.countByUserIdAndCompleted(userId, true);

        checkAndAwardBadges(userId, completedGoals, BadgeCategory.GOAL);
    }

    /**
     * Generic method to check and award badges for a specific category
     *
     * @param userId the user ID
     * @param count the current count (tasks, pomodoros or goals completed)
     * @param category the badge category to check
     */
    private void checkAndAwardBadges(Long userId, long count, BadgeCategory category) {
        BadgeType.getByCategory(category)
                .forEach(
                        badgeType -> {
                            if (count >= badgeType.getRequirement()
                                    && !badgeRepository.existsByUserIdAndBadgeType(
                                            userId, badgeType)) {
                                badgeService.awardBadge(userId, badgeType);
                                log.info(
                                        "Awarded {} badge to user {}", badgeType.getName(), userId);
                            }
                        });
    }
}
