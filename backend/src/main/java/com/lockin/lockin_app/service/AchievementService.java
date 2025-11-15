package com.lockin.lockin_app.service;

import com.lockin.lockin_app.dto.AchievementDTO;
import com.lockin.lockin_app.entity.TaskStatus;
import com.lockin.lockin_app.repository.FocusSessionRepository;
import com.lockin.lockin_app.repository.GoalRepository;
import com.lockin.lockin_app.repository.TaskRepository;

import lombok.RequiredArgsConstructor;

import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

/**
 * Service for calculating user achievements
 *
 * <p>Achievements are dynamically calculated based on user activity and milestones
 */
@Service
@RequiredArgsConstructor
public class AchievementService {

    private final TaskRepository taskRepository;
    private final FocusSessionRepository focusSessionRepository;
    private final GoalRepository goalRepository;

    /**
     * Retrieves all achievements for a user
     *
     * @param userId user ID
     * @return list of achievements with progress
     */
    public List<AchievementDTO> getUserAchievements(Long userId) {
        List<AchievementDTO> achievements = new ArrayList<>();

        // Calculate task-based achievements
        int completedTasks = taskRepository.findByUserIdAndStatus(userId, TaskStatus.COMPLETED).size();
        achievements.add(createTaskAchievement("first_task", "First Task", "Complete your first task", 1, completedTasks));
        achievements.add(createTaskAchievement("task_10", "Task Master", "Complete 10 tasks", 10, completedTasks));
        achievements.add(createTaskAchievement("task_50", "Productivity Pro", "Complete 50 tasks", 50, completedTasks));
        achievements.add(createTaskAchievement("task_100", "Century Club", "Complete 100 tasks", 100, completedTasks));

        // Calculate focus session achievements
        int totalSessions = focusSessionRepository.findByUserIdOrderByStartedAtDesc(userId).size();
        achievements.add(createFocusAchievement("first_session", "First Focus", "Complete your first focus session", 1, totalSessions));
        achievements.add(createFocusAchievement("session_25", "Pomodoro Master", "Complete 25 focus sessions", 25, totalSessions));
        achievements.add(createFocusAchievement("session_100", "Focus Warrior", "Complete 100 focus sessions", 100, totalSessions));

        // Calculate goal achievements
        int completedGoals = (int) goalRepository.findByUserIdOrderByCreatedAtDesc(userId).stream()
                .filter(goal -> goal.getCompleted() != null && goal.getCompleted())
                .count();
        achievements.add(createGoalAchievement("first_goal", "Goal Setter", "Complete your first goal", 1, completedGoals));
        achievements.add(createGoalAchievement("goal_5", "Achiever", "Complete 5 goals", 5, completedGoals));
        achievements.add(createGoalAchievement("goal_10", "Goal Master", "Complete 10 goals", 10, completedGoals));

        return achievements;
    }

    private AchievementDTO createTaskAchievement(String id, String title, String description, int target, int progress) {
        boolean unlocked = progress >= target;
        return AchievementDTO.builder()
                .id(id)
                .title(title)
                .description(description)
                .category("TASKS")
                .unlocked(unlocked)
                .unlockedDate(unlocked ? LocalDate.now() : null) // TODO: Track actual unlock date
                .progress(Math.min(progress, target))
                .target(target)
                .build();
    }

    private AchievementDTO createFocusAchievement(String id, String title, String description, int target, int progress) {
        boolean unlocked = progress >= target;
        return AchievementDTO.builder()
                .id(id)
                .title(title)
                .description(description)
                .category("FOCUS")
                .unlocked(unlocked)
                .unlockedDate(unlocked ? LocalDate.now() : null)
                .progress(Math.min(progress, target))
                .target(target)
                .build();
    }

    private AchievementDTO createGoalAchievement(String id, String title, String description, int target, int progress) {
        boolean unlocked = progress >= target;
        return AchievementDTO.builder()
                .id(id)
                .title(title)
                .description(description)
                .category("GOALS")
                .unlocked(unlocked)
                .unlockedDate(unlocked ? LocalDate.now() : null)
                .progress(Math.min(progress, target))
                .target(target)
                .build();
    }
}
