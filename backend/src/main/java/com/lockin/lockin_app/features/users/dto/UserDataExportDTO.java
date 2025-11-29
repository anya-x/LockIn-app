package com.lockin.lockin_app.features.users.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

/**
 * DTO for GDPR data export containing all user data.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserDataExportDTO {

    private LocalDateTime exportedAt;
    private UserProfileData profile;
    private List<TaskData> tasks;
    private List<GoalData> goals;
    private List<CategoryData> categories;
    private List<FocusSessionData> focusSessions;
    private List<NotificationData> notifications;
    private List<BadgeData> badges;
    private List<AnalyticsData> analytics;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UserProfileData {
        private Long id;
        private String firstName;
        private String lastName;
        private String email;
        private Integer currentStreak;
        private Integer longestStreak;
        private String lastActivityDate;
        private Boolean notifyAiFeatures;
        private Boolean notifyCalendarSync;
        private Boolean notifyTaskReminders;
        private String createdAt;
        private String updatedAt;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TaskData {
        private Long id;
        private String title;
        private String description;
        private Boolean isUrgent;
        private Boolean isImportant;
        private String status;
        private String dueDate;
        private String categoryName;
        private String createdAt;
        private String updatedAt;
        private String completedAt;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class GoalData {
        private Long id;
        private String title;
        private String description;
        private String type;
        private String startDate;
        private String endDate;
        private Integer targetTasks;
        private Integer targetPomodoros;
        private Integer targetFocusMinutes;
        private Integer currentTasks;
        private Integer currentPomodoros;
        private Integer currentFocusMinutes;
        private Boolean completed;
        private String completedDate;
        private String createdAt;
        private String updatedAt;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CategoryData {
        private Long id;
        private String name;
        private String color;
        private String createdAt;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class FocusSessionData {
        private Long id;
        private String sessionType;
        private Integer durationMinutes;
        private String startedAt;
        private String endedAt;
        private Boolean completed;
        private String notes;
        private String taskTitle;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class NotificationData {
        private Long id;
        private String type;
        private String title;
        private String message;
        private Boolean isRead;
        private String createdAt;
        private String readAt;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class BadgeData {
        private Long id;
        private String badgeType;
        private String name;
        private String description;
        private String earnedAt;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AnalyticsData {
        private String date;
        private Integer tasksCreated;
        private Integer tasksCompleted;
        private Integer pomodorosCompleted;
        private Integer focusMinutes;
        private Double productivityScore;
    }
}
