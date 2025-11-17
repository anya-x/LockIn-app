package com.lockin.lockin_app.service;

import com.lockin.lockin_app.event.GoalCompletedEvent;
import com.lockin.lockin_app.event.PomodoroCompletedEvent;
import com.lockin.lockin_app.event.TaskCompletedEvent;
import com.lockin.lockin_app.repository.FocusSessionRepository;
import com.lockin.lockin_app.repository.TaskRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

/**
 * Event listener for asynchronously updating goals when tasks/sessions complete
 *
 * <p>This decouples goal updates from the main task/session workflows, improving API response
 * times and making the system more resilient.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class GoalEventListener {

    private final GoalService goalService;
    private final FocusSessionRepository focusSessionRepository;
    private final TaskRepository taskRepository;

    /**
     * Handle task completion events and update related goals
     *
     * @param event TaskCompletedEvent containing userId and taskId
     */
    @Async
    @EventListener
    public void onTaskCompleted(TaskCompletedEvent event) {
        log.debug(
                "TaskCompletedEvent received for user {} and task {}",
                event.getUserId(),
                event.getTaskId());

        Long userId = event.getUserId();
        Long taskId = event.getTaskId();

        try {
            // Fetch task completion time
            taskRepository
                    .findById(taskId)
                    .ifPresent(
                            task -> {
                                LocalDateTime completionTime =
                                        task.getCompletedAt() != null
                                                ? task.getCompletedAt()
                                                : LocalDateTime.now();
                                goalService.updateGoalsFromTaskCompletion(userId, completionTime);
                                log.info("Updated goals after task {} completion for user {}", taskId, userId);
                            });
        } catch (Exception e) {
            log.error("Failed to update goals for task completion: {}", e.getMessage(), e);
            // Don't rethrow - this is async, we don't want to break the task completion
        }
    }

    /**
     * Handle pomodoro/session completion events and update related goals
     *
     * @param event PomodoroCompletedEvent containing userId and sessionId
     */
    @Async
    @EventListener
    public void onPomodoroCompleted(PomodoroCompletedEvent event) {
        log.debug(
                "PomodoroCompletedEvent received for user {} and session {}",
                event.getUserId(),
                event.getSessionId());

        Long userId = event.getUserId();
        Long sessionId = event.getSessionId();

        try {
            // Fetch session details and update goals
            focusSessionRepository
                    .findById(sessionId)
                    .ifPresent(
                            session -> {
                                // Convert entity to DTO for service method
                                com.lockin.lockin_app.dto.FocusSessionResponseDTO sessionDTO =
                                        com.lockin.lockin_app.dto.FocusSessionResponseDTO
                                                .fromEntity(session);
                                goalService.updateGoalsFromSession(userId, sessionDTO);
                                log.info(
                                        "Updated goals after session {} completion for user {}",
                                        sessionId,
                                        userId);
                            });
        } catch (Exception e) {
            log.error("Failed to update goals for session completion: {}", e.getMessage(), e);
            // Don't rethrow - this is async, we don't want to break the session completion
        }
    }

    /**
     * Handle goal completion events (for potential future use)
     *
     * <p>Currently a placeholder for future features like: - Sending notifications when goals
     * complete - Triggering analytics recalculation - Creating goal completion reports
     *
     * @param event GoalCompletedEvent containing userId and goalId
     */
    @Async
    @EventListener
    public void onGoalCompleted(GoalCompletedEvent event) {
        log.info(
                "GoalCompletedEvent received for user {} and goal {}",
                event.getUserId(),
                event.getGoalId());

        // Placeholder for future goal completion side effects
        // Examples:
        // - Send congratulations notification
        // - Trigger analytics recalculation
        // - Update streaks or achievements
    }
}
