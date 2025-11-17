package com.lockin.lockin_app.entity;

public enum BadgeType {
    // Easy badges (quick wins)
    FIRST_STEPS("First Steps", "Complete your first task", "👣"),
    TASK_TERMINATOR("Task Terminator", "Complete 100 total tasks", "💪"),
    POMODORO_100("100 Pomodoros", "Complete 100 pomodoro sessions", "🍅"),

    // Medium badges (achievable with effort)
    WEEK_WARRIOR("Week Warrior", "7 consecutive productive days", "⚔️"),
    DEEP_WORK_MASTER("Deep Work Master", "4+ hours focus per day for a week", "🧠"),
    FLOW_STATE("Flow State", "Achieve 5+ hours of focus in one day", "🌊"),
    GOAL_CRUSHER("Goal Crusher", "Complete 10 goals", "💥"),
    EARLY_BIRD("Early Bird", "Start work before 8 AM for 7 consecutive days", "🌅"),

    // Hard badges (long-term achievements)
    ZEN_MODE("Zen Mode", "Low burnout risk for an entire month", "🧘"),
    MONTH_MARATHONER("Month Marathoner", "30 consecutive productive days", "🏃"),
    POMODORO_500("500 Pomodoros", "Complete 500 total pomodoro sessions", "🍅🍅"),
    SUSTAINABLE_PACE("Sustainable Pace", "Work 5-6 hours daily for 2 weeks", "🌱");

    private final String displayName;
    private final String description;
    private final String icon;

    BadgeType(String displayName, String description, String icon) {
        this.displayName = displayName;
        this.description = description;
        this.icon = icon;
    }

    public String getDisplayName() {
        return displayName;
    }

    public String getDescription() {
        return description;
    }

    public String getIcon() {
        return icon;
    }
}
