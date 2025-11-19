package com.lockin.lockin_app.features.badges.entity;

import lombok.Getter;

import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

@Getter
public enum BadgeType {
    // Task completion badges
    FIRST_STEPS("First Steps", "Complete your first task", "🎯", 1, BadgeCategory.TASK),
    TASK_WARRIOR("Task Warrior", "Complete 10 tasks", "⚔️", 10, BadgeCategory.TASK),
    TASK_MASTER("Task Master", "Complete 50 tasks", "👑", 50, BadgeCategory.TASK),
    TASK_TERMINATOR("Task Terminator", "Complete 100 tasks", "🏆", 100, BadgeCategory.TASK),

    // Pomodoro badges
    FOCUS_NOVICE("Focus Novice", "Complete your first pomodoro", "🌱", 1, BadgeCategory.POMODORO),
    FOCUS_APPRENTICE("Focus Apprentice", "Complete 25 pomodoros", "🔥", 25, BadgeCategory.POMODORO),
    POMODORO_100("Pomodoro Pro", "Complete 100 pomodoros", "💯", 100, BadgeCategory.POMODORO),
    POMODORO_500("Pomodoro Legend", "Complete 500 pomodoros", "⭐", 500, BadgeCategory.POMODORO),

    // Goal badges
    GOAL_SETTER("Goal Setter", "Complete your first goal", "🎪", 1, BadgeCategory.GOAL),
    GOAL_ACHIEVER("Goal Achiever", "Complete 5 goals", "🎊", 5, BadgeCategory.GOAL),
    GOAL_CRUSHER("Goal Crusher", "Complete 10 goals", "💪", 10, BadgeCategory.GOAL);

    private final String name;
    private final String description;
    private final String icon;
    private final int requirement;
    private final BadgeCategory category;

    BadgeType(
            String name, String description, String icon, int requirement, BadgeCategory category) {
        this.name = name;
        this.description = description;
        this.icon = icon;
        this.requirement = requirement;
        this.category = category;
    }

    public static List<BadgeType> getByCategory(BadgeCategory category) {
        return Arrays.stream(values())
                .filter(badge -> badge.category == category)
                .collect(Collectors.toList());
    }

    public enum BadgeCategory {
        TASK,
        POMODORO,
        GOAL
    }
}
