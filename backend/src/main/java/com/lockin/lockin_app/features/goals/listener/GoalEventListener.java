package com.lockin.lockin_app.features.goals.service;

import com.lockin.lockin_app.event.GoalCompletedEvent;
import com.lockin.lockin_app.event.PomodoroCompletedEvent;
import com.lockin.lockin_app.event.TaskCompletedEvent;
import com.lockin.lockin_app.features.focus_sessions.repository.FocusSessionRepository;
import com.lockin.lockin_app.features.tasks.repository.TaskRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

import java.time.LocalDateTime;

@Slf4j
@Component
@RequiredArgsConstructor
public class GoalEventListener {

    private final GoalService goalService;
    private final FocusSessionRepository focusSessionRepository;
    private final TaskRepository taskRepository;

    @TransactionalEventListener(phase = TransactionPhase.BEFORE_COMMIT)
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
                                log.info(
                                        "Updated goals after task {} completion for user {}",
                                        taskId,
                                        userId);
                            });
        } catch (Exception e) {
            log.error("Failed to update goals for task completion: {}", e.getMessage(), e);
        }
    }

    @TransactionalEventListener(phase = TransactionPhase.BEFORE_COMMIT)
    public void onPomodoroCompleted(PomodoroCompletedEvent event) {
        log.debug(
                "PomodoroCompletedEvent received for user {} and session {}",
                event.getUserId(),
                event.getSessionId());

        Long userId = event.getUserId();
        Long sessionId = event.getSessionId();

        try {
            focusSessionRepository
                    .findById(sessionId)
                    .ifPresent(
                            session -> {
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
        }
    }

    @TransactionalEventListener(phase = TransactionPhase.BEFORE_COMMIT)
    public void onGoalCompleted(GoalCompletedEvent event) {
        log.info(
                "GoalCompletedEvent received for user {} and goal {}",
                event.getUserId(),
                event.getGoalId());
    }
}
