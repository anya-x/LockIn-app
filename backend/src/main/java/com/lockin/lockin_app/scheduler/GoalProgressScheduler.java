package com.lockin.lockin_app.scheduler;

import com.lockin.lockin_app.entity.DailyAnalytics;
import com.lockin.lockin_app.entity.Goal;
import com.lockin.lockin_app.repository.DailyAnalyticsRepository;
import com.lockin.lockin_app.repository.GoalRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

/**
 * Scheduled job to update goal progress automatically
 *
 * <p>Runs nightly to check all active goals and update their metrics from DailyAnalytics
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class GoalProgressScheduler {

    private final GoalRepository goalRepository;
    private final DailyAnalyticsRepository analyticsRepository;

    /**
     * Updates progress for all active goals
     *
     * <p>Runs at 2:30 AM daily (after daily analytics calculation at 2:00 AM)
     */
    @Scheduled(cron = "0 30 2 * * ?")
    @Transactional
    public void updateGoalProgress() {
        log.info("Starting scheduled goal progress update");

        List<Goal> activeGoals = goalRepository.findAllByCompletedFalse();
        int successCount = 0;
        int errorCount = 0;
        int completedCount = 0;

        for (Goal goal : activeGoals) {
            try {
                boolean wasUpdated = updateGoalMetrics(goal);
                if (wasUpdated) {
                    successCount++;
                    if (goal.getCompleted()) {
                        completedCount++;
                    }
                }
            } catch (Exception e) {
                log.error(
                        "Failed to update goal {} for user {}: {}",
                        goal.getId(),
                        goal.getUser().getId(),
                        e.getMessage());
                errorCount++;
            }
        }

        log.info(
                "Goal progress update complete. Success: {}, Completed: {}, Errors: {}",
                successCount,
                completedCount,
                errorCount);
    }

    private boolean updateGoalMetrics(Goal goal) {
        LocalDate today = LocalDate.now();

        if (goal.getStartDate() != null && today.isBefore(goal.getStartDate())) {
            return false;
        }

        if (goal.getEndDate() != null && today.isAfter(goal.getEndDate())) {
            return false;
        }

        LocalDate startDate = goal.getStartDate() != null ? goal.getStartDate() : today;
        LocalDate endDate = today;

        List<DailyAnalytics> analytics =
                analyticsRepository.findByUserAndDateBetweenOrderByDateDesc(
                        goal.getUser(), startDate, endDate);

        int totalTasks = 0;
        int totalPomodoros = 0;
        int totalFocusMinutes = 0;

        for (DailyAnalytics day : analytics) {
            totalTasks += day.getTasksCompleted() != null ? day.getTasksCompleted() : 0;
            totalPomodoros +=
                    day.getPomodorosCompleted() != null ? day.getPomodorosCompleted() : 0;
            totalFocusMinutes +=
                    day.getFocusMinutes() != null ? day.getFocusMinutes() : 0;
        }

        goal.setCurrentTasks(totalTasks);
        goal.setCurrentPomodoros(totalPomodoros);
        goal.setCurrentFocusMinutes(totalFocusMinutes);

        checkGoalCompletion(goal);
        goalRepository.save(goal);

        log.debug(
                "Updated goal {}: Tasks={}/{}, Pomodoros={}/{}, Focus={}/{}",
                goal.getId(),
                goal.getCurrentTasks(),
                goal.getTargetTasks(),
                goal.getCurrentPomodoros(),
                goal.getTargetPomodoros(),
                goal.getCurrentFocusMinutes(),
                goal.getTargetFocusMinutes());

        return true;
    }

    private void checkGoalCompletion(Goal goal) {
        boolean isCompleted = true;

        if (goal.getTargetTasks() != null && goal.getTargetTasks() > 0) {
            if (goal.getCurrentTasks() < goal.getTargetTasks()) {
                isCompleted = false;
            }
        }

        if (goal.getTargetPomodoros() != null && goal.getTargetPomodoros() > 0) {
            if (goal.getCurrentPomodoros() < goal.getTargetPomodoros()) {
                isCompleted = false;
            }
        }

        if (goal.getTargetFocusMinutes() != null && goal.getTargetFocusMinutes() > 0) {
            if (goal.getCurrentFocusMinutes() < goal.getTargetFocusMinutes()) {
                isCompleted = false;
            }
        }

        if (isCompleted && !goal.getCompleted()) {
            goal.setCompleted(true);
            goal.setCompletedDate(LocalDate.now());
            log.info("Goal {} completed!", goal.getId());
        }
    }
}
