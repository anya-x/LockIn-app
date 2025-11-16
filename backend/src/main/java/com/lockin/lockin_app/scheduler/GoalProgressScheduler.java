package com.lockin.lockin_app.scheduler;

import com.lockin.lockin_app.entity.Goal;
import com.lockin.lockin_app.entity.User;
import com.lockin.lockin_app.repository.GoalRepository;
import com.lockin.lockin_app.service.AnalyticsCalculationService;
import com.lockin.lockin_app.dto.DailyAnalyticsDTO;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class GoalProgressScheduler {

    private final GoalRepository goalRepository;
    private final AnalyticsCalculationService analyticsService;

    /**
     * Updates goal progress nightly at 2 AM
     * Checks all active goals and updates metrics from DailyAnalytics
     */
    @Scheduled(cron = "0 0 2 * * *") // Run at 2 AM every day
    public void updateGoalProgress() {
        log.info("Starting scheduled goal progress update");

        List<Goal> activeGoals = goalRepository.findAll().stream()
                .filter(goal -> goal.getStatus() != null && !goal.getStatus().equals("COMPLETED"))
                .toList();

        log.info("Found {} active goals to update", activeGoals.size());

        for (Goal goal : activeGoals) {
            try {
                updateGoalMetrics(goal);
            } catch (Exception e) {
                log.error("Error updating goal {}: {}", goal.getId(), e.getMessage(), e);
            }
        }

        log.info("Completed goal progress update");
    }

    private void updateGoalMetrics(Goal goal) {
        User user = goal.getUser();
        LocalDate today = LocalDate.now();

        // Get today's analytics
        DailyAnalyticsDTO todayAnalytics = analyticsService.calculateDailyAnalytics(
                user.getId(), today);

        // Update goal current values
        // Note: This is a simplified version - actual implementation would need
        // to aggregate data based on goal type (DAILY, WEEKLY, MONTHLY)
        goal.setCurrentTasks(
                goal.getCurrentTasks() != null
                        ? goal.getCurrentTasks() + todayAnalytics.getTasksCompleted()
                        : todayAnalytics.getTasksCompleted());

        goal.setCurrentPomodoros(
                goal.getCurrentPomodoros() != null
                        ? goal.getCurrentPomodoros() + todayAnalytics.getPomodorosCompleted()
                        : todayAnalytics.getPomodorosCompleted());

        goal.setCurrentFocusMinutes(
                goal.getCurrentFocusMinutes() != null
                        ? goal.getCurrentFocusMinutes() + todayAnalytics.getFocusMinutes()
                        : todayAnalytics.getFocusMinutes());

        // Calculate progress percentage
        double progress = calculateGoalProgress(goal);
        goal.setProgress(progress);

        // Mark as completed if reached 100%
        if (progress >= 100.0) {
            goal.setStatus("COMPLETED");
            log.info("Goal {} completed for user {}", goal.getId(), user.getEmail());
        }

        goalRepository.save(goal);
        log.debug("Updated goal {} progress to {}%", goal.getId(), progress);
    }

    private double calculateGoalProgress(Goal goal) {
        int targetsSet = 0;
        double totalProgress = 0.0;

        if (goal.getTargetTasks() != null && goal.getTargetTasks() > 0) {
            targetsSet++;
            totalProgress += (goal.getCurrentTasks() / (double) goal.getTargetTasks()) * 100;
        }

        if (goal.getTargetPomodoros() != null && goal.getTargetPomodoros() > 0) {
            targetsSet++;
            totalProgress += (goal.getCurrentPomodoros() / (double) goal.getTargetPomodoros()) * 100;
        }

        if (goal.getTargetFocusMinutes() != null && goal.getTargetFocusMinutes() > 0) {
            targetsSet++;
            totalProgress +=
                    (goal.getCurrentFocusMinutes() / (double) goal.getTargetFocusMinutes()) * 100;
        }

        return targetsSet > 0 ? totalProgress / targetsSet : 0.0;
    }
}
