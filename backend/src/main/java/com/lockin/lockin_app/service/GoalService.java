package com.lockin.lockin_app.service;

import com.lockin.lockin_app.dto.FocusSessionResponseDTO;
import com.lockin.lockin_app.dto.GoalRequestDTO;
import com.lockin.lockin_app.dto.GoalResponseDTO;
import com.lockin.lockin_app.entity.Goal;
import com.lockin.lockin_app.entity.User;
import com.lockin.lockin_app.exception.ResourceNotFoundException;
import com.lockin.lockin_app.exception.UnauthorizedException;
import com.lockin.lockin_app.repository.GoalRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class GoalService {

    private final GoalRepository goalRepository;
    private final UserService userService;

    /**
     * Creates a new goal for the user
     *
     * @param userId owner of the goal
     * @param request goal details
     * @return created goal with generated ID
     * @throws ResourceNotFoundException if user doesn't exist
     */
    @Transactional
    public GoalResponseDTO createGoal(Long userId, GoalRequestDTO request) {
        log.info("Creating goal for user: {}", userId);

        User user = userService.getUserById(userId);

        if (!request.hasAtLeastOneTarget()) {
            throw new IllegalArgumentException(
                    "At least one target (tasks, pomodoros, or focus minutes) must be set");
        }

        if (request.getStartDate() != null && request.getEndDate() != null) {
            if (request.getStartDate().isAfter(request.getEndDate())) {
                throw new IllegalArgumentException(
                        "Start date must be before or equal to end date");
            }
        }

        Goal goal = new Goal();
        goal.setUser(user);
        updateGoalFromRequest(goal, request);

        Goal saved = goalRepository.save(goal);

        log.info("Created goal: {}", saved.getId());

        return GoalResponseDTO.fromEntity(saved);
    }

    private void updateGoalFromRequest(Goal goal, GoalRequestDTO request) {
        if (request.getTitle() != null) {
            goal.setTitle(request.getTitle());
        }
        if (request.getDescription() != null) {
            goal.setDescription(request.getDescription());
        }
        if (request.getType() != null) {
            goal.setType(request.getType());
        }
        if (request.getStartDate() != null) {
            goal.setStartDate(request.getStartDate());
        }
        if (request.getEndDate() != null) {
            goal.setEndDate(request.getEndDate());
        }

        if (request.getTargetTasks() != null) {
            goal.setTargetTasks(request.getTargetTasks());
        }
        if (request.getTargetPomodoros() != null) {
            goal.setTargetPomodoros(request.getTargetPomodoros());
        }
        if (request.getTargetFocusMinutes() != null) {
            goal.setTargetFocusMinutes(request.getTargetFocusMinutes());
        }

        if (request.getCurrentTasks() != null) {
            goal.setCurrentTasks(request.getCurrentTasks());
        }
        if (request.getCurrentPomodoros() != null) {
            goal.setCurrentPomodoros(request.getCurrentPomodoros());
        }
        if (request.getCurrentFocusMinutes() != null) {
            goal.setCurrentFocusMinutes(request.getCurrentFocusMinutes());
        }
    }

    @Transactional(readOnly = true)
    public List<GoalResponseDTO> getUserGoals(Long userId) {
        log.debug("Fetching goals for user: {}", userId);

        List<Goal> goals = goalRepository.findByUserIdOrderByCreatedAtDesc(userId);

        return goals.stream().map(GoalResponseDTO::fromEntity).collect(Collectors.toList());
    }

    /**
     * Gets a specific goal
     *
     * <p>Validates user owns the goal before returning.
     *
     * @throws ResourceNotFoundException if goal doesn't exist
     * @throws UnauthorizedException if user doesn't own goal
     */
    @Transactional(readOnly = true)
    public GoalResponseDTO getGoal(Long goalId, Long userId) {
        log.debug("Fetching goal: {} for user: {}", goalId, userId);

        Goal goal =
                goalRepository
                        .findById(goalId)
                        .orElseThrow(() -> new ResourceNotFoundException("Goal", "id", goalId));

        validateGoalOwnership(goal, userId);

        return GoalResponseDTO.fromEntity(goal);
    }

    /**
     * Updates an existing goal
     *
     * <p>Automatically marks goal as complete when progress reaches 100%
     *
     * @throws ResourceNotFoundException if goal doesn't exist
     * @throws UnauthorizedException if user doesn't own goal
     */
    @Transactional
    public GoalResponseDTO updateGoal(Long goalId, Long userId, GoalRequestDTO request) {
        log.info("Updating goal: {} for user: {}", goalId, userId);

        Goal goal =
                goalRepository
                        .findById(goalId)
                        .orElseThrow(() -> new ResourceNotFoundException("Goal", "id", goalId));

        validateGoalOwnership(goal, userId);

        if (request.getStartDate() != null && request.getEndDate() != null) {
            if (request.getStartDate().isAfter(request.getEndDate())) {
                throw new IllegalArgumentException(
                        "Start date must be before or equal to end date");
            }
        }

        updateGoalFromRequest(goal, request);

        checkAndMarkComplete(goal);

        Goal updated = goalRepository.save(goal);

        log.info("Updated goal: {}", updated.getId());

        return GoalResponseDTO.fromEntity(updated);
    }

    @Transactional
    public void deleteGoal(Long goalId, Long userId) {
        log.info("Deleting goal: {} for user: {}", goalId, userId);

        Goal goal =
                goalRepository
                        .findById(goalId)
                        .orElseThrow(() -> new ResourceNotFoundException("Goal", "id", goalId));

        validateGoalOwnership(goal, userId);

        goalRepository.delete(goal);

        log.info("Deleted goal: {}", goalId);
    }

    /** Check if goal targets are met and mark as complete */
    private void checkAndMarkComplete(Goal goal) {
        if (goal.getProgressPercentage() >= 100.0 && !goal.getCompleted()) {
            goal.setCompleted(true);
            goal.setCompletedDate(LocalDate.now());
        }
    }

    @Transactional
    public void updateGoalsFromSession(Long userId, FocusSessionResponseDTO session) {
        log.debug("Updating goals for user {} after session completion", userId);

        List<Goal> activeGoals =
                goalRepository.findByUserIdAndCompletedOrderByCreatedAtDesc(userId, false);

        if (activeGoals.isEmpty()) {
            log.debug("No active goals to update for user {}", userId);
            return;
        }

        LocalDate sessionDate =
                session.getCompletedAt() != null
                        ? session.getCompletedAt().toLocalDate()
                        : LocalDate.now();

        for (Goal goal : activeGoals) {
            if (Boolean.TRUE.equals(goal.getCompleted())) {
                log.debug("Skipping completed goal {}", goal.getId());
                continue;
            }

            if (sessionDate.isBefore(goal.getStartDate())
                    || sessionDate.isAfter(goal.getEndDate())) {
                log.debug("⏭Session outside date range for goal {}", goal.getId());
                continue;
            }

            boolean updated = false;

            if ("WORK".equals(session.getSessionType().name())
                    && Boolean.TRUE.equals(session.getCompleted())
                    && goal.getTargetPomodoros() != null
                    && goal.getTargetPomodoros() > 0) {

                if (goal.getCurrentPomodoros() < goal.getTargetPomodoros()) {
                    goal.setCurrentPomodoros(goal.getCurrentPomodoros() + 1);
                    updated = true;
                } else {
                    log.debug(
                            "Goal {} already at pomodoro target ({}/{})",
                            goal.getId(),
                            goal.getCurrentPomodoros(),
                            goal.getTargetPomodoros());
                }
            }

            if (session.getActualMinutes() != null
                    && session.getActualMinutes() > 0
                    && goal.getTargetFocusMinutes() != null
                    && goal.getTargetFocusMinutes() > 0) {

                if (goal.getCurrentFocusMinutes() < goal.getTargetFocusMinutes()) {
                    int newMinutes = goal.getCurrentFocusMinutes() + session.getActualMinutes();

                    goal.setCurrentFocusMinutes(Math.min(newMinutes, goal.getTargetFocusMinutes()));
                    updated = true;
                } else {
                    log.debug(
                            "Goal {} already at focus minutes target ({}/{})",
                            goal.getId(),
                            goal.getCurrentFocusMinutes(),
                            goal.getTargetFocusMinutes());
                }
            }

            if (updated) {
                checkAndMarkComplete(goal);
                goalRepository.save(goal);
            }
        }
    }

    @Transactional
    public void updateGoalsFromTaskCompletion(Long userId, LocalDateTime taskCompletedAt) {
        log.debug("Updating goals for user {} after task completion", userId);

        List<Goal> activeGoals =
                goalRepository.findByUserIdAndCompletedOrderByCreatedAtDesc(userId, false);

        if (activeGoals.isEmpty()) {
            log.debug("No active goals to update for user {}", userId);
            return;
        }

        LocalDate completionDate =
                taskCompletedAt != null ? taskCompletedAt.toLocalDate() : LocalDate.now();

        for (Goal goal : activeGoals) {
            if (Boolean.TRUE.equals(goal.getCompleted())) {
                log.debug("Skipping completed goal {}", goal.getId());
                continue;
            }

            if (completionDate.isBefore(goal.getStartDate())
                    || completionDate.isAfter(goal.getEndDate())) {
                log.debug("Task completion outside date range for goal {}", goal.getId());
                continue;
            }


            if (goal.getTargetTasks() != null && goal.getTargetTasks() > 0) {

                if (goal.getCurrentTasks() < goal.getTargetTasks()) {
                    goal.setCurrentTasks(goal.getCurrentTasks() + 1);

                    log.debug(
                            "Incremented tasks for goal {}: {}/{}",
                            goal.getId(),
                            goal.getCurrentTasks(),
                            goal.getTargetTasks());

                    checkAndMarkComplete(goal);
                    goalRepository.save(goal);

                } else {
                    log.debug(
                            "Goal {} already at task target ({}/{})",
                            goal.getId(),
                            goal.getCurrentTasks(),
                            goal.getTargetTasks());
                }
            }
        }
    }

    /**
     * Validates goal ownership and throws exception if user doesn't own it
     *
     * @throws UnauthorizedException if goal doesn't belong to user
     */
    private void validateGoalOwnership(Goal goal, Long userId) {
        if (!goal.getUser().getId().equals(userId)) {
            log.warn(
                    "User {} attempted to access goal {} owned by user {}",
                    userId,
                    goal.getId(),
                    goal.getUser().getId());
            throw new UnauthorizedException("You do not have permission to access this goal");
        }
    }
}
