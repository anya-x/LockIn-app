package com.lockin.lockin_app.entity;

import lombok.Getter;

@Getter
public enum BadgeType {
    // Task completion badges
    FIRST_STEPS("First Steps", "Complete your first task", "🎯", 1),
    TASK_WARRIOR("Task Warrior", "Complete 10 tasks", "⚔️", 10),
    TASK_MASTER("Task Master", "Complete 50 tasks", "👑", 50),
    TASK_TERMINATOR("Task Terminator", "Complete 100 tasks", "🏆", 100),

    // Pomodoro badges
    FOCUS_NOVICE("Focus Novice", "Complete your first pomodoro", "🌱", 1),
    FOCUS_APPRENTICE("Focus Apprentice", "Complete 25 pomodoros", "🔥", 25),
    POMODORO_100("Pomodoro Pro", "Complete 100 pomodoros", "💯", 100),
    POMODORO_500("Pomodoro Legend", "Complete 500 pomodoros", "⭐", 500),

    // Goal badges
    GOAL_SETTER("Goal Setter", "Create your first goal", "🎪", 1),
    GOAL_ACHIEVER("Goal Achiever", "Complete 5 goals", "🎊", 5),
    GOAL_CRUSHER("Goal Crusher", "Complete 10 goals", "💪", 10);

    private final String name;
    private final String description;
    private final String icon;
    private final int requirement;

    BadgeType(String name, String description, String icon, int requirement) {
        this.name = name;
        this.description = description;
        this.icon = icon;
        this.requirement = requirement;
    }
}
