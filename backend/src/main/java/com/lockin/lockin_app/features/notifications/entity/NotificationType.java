package com.lockin.lockin_app.features.notifications.entity;

/**
 * Notification type constants.
 * Using constants instead of enum for flexibility with new types.
 */
public final class NotificationType {

    private NotificationType() {
        // Prevent instantiation
    }

    // AI Features
    public static final String AI_BREAKDOWN = "AI_BREAKDOWN";
    public static final String DAILY_BRIEFING = "DAILY_BRIEFING";
    public static final String AI_ENHANCEMENT = "AI_ENHANCEMENT";

    // Calendar
    public static final String CALENDAR_SYNC = "CALENDAR_SYNC";
    public static final String CALENDAR_CONNECTED = "CALENDAR_CONNECTED";

    // Task Reminders
    public static final String TASK_DUE = "TASK_DUE";
    public static final String TASK_OVERDUE = "TASK_OVERDUE";
    public static final String TASK_COMPLETED = "TASK_COMPLETED";

    // System
    public static final String SYSTEM = "SYSTEM";
    public static final String WELCOME = "WELCOME";

    /**
     * Check if the type is a valid notification type.
     */
    public static boolean isValid(String type) {
        return type != null && (
            type.equals(AI_BREAKDOWN) ||
            type.equals(DAILY_BRIEFING) ||
            type.equals(AI_ENHANCEMENT) ||
            type.equals(CALENDAR_SYNC) ||
            type.equals(CALENDAR_CONNECTED) ||
            type.equals(TASK_DUE) ||
            type.equals(TASK_OVERDUE) ||
            type.equals(TASK_COMPLETED) ||
            type.equals(SYSTEM) ||
            type.equals(WELCOME)
        );
    }
}
