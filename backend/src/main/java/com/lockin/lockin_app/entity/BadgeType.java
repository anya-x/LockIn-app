package com.lockin.lockin_app.entity;

public enum BadgeType {
    POMODORO_100("100 Pomodoros", "Complete 100 pomodoro sessions", "🍅"),
    WEEK_WARRIOR("Week Warrior", "7 consecutive productive days", "⚔️"),
    DEEP_WORK_MASTER("Deep Work Master", "4+ hours focus per day for a week", "🧠"),
    ZEN_MODE("Zen Mode", "Low burnout risk for an entire month", "🧘");

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
