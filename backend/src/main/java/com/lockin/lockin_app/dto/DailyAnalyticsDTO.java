package com.lockin.lockin_app.dto;

import com.lockin.lockin_app.entity.DailyAnalytics;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DailyAnalyticsDTO {
    private LocalDate date;

    // Task metrics
    private Integer tasksCreated;
    private Integer tasksCompleted;
    private Integer tasksCompletedFromToday;
    private Double completionRate;

    // Pomodoro metrics
    private Integer pomodorosCompleted;
    private Integer focusMinutes;
    private Integer breakMinutes;
    private Integer interruptedSessions;

    // Time of day productivity
    private Integer morningFocusMinutes;
    private Integer afternoonFocusMinutes;
    private Integer eveningFocusMinutes;
    private Integer nightFocusMinutes;

    // Scores
    private Double productivityScore;
    private Double focusScore;
    private Double burnoutRiskScore;

    // Burnout indicators
    private Integer lateNightSessions;
    private Integer overworkMinutes;
    private Integer consecutiveWorkDays; // Used in burnout calculation

    // Eisenhower distribution
    private Integer urgentImportantCount;
    private Integer notUrgentImportantCount;
    private Integer urgentNotImportantCount;
    private Integer notUrgentNotImportantCount;

    public static DailyAnalyticsDTO fromEntity(DailyAnalytics analytics) {
        return DailyAnalyticsDTO.builder()
                .date(analytics.getDate())
                .tasksCreated(analytics.getTasksCreated())
                .tasksCompleted(analytics.getTasksCompleted())
                .tasksCompletedFromToday(analytics.getTasksCompletedFromToday())
                .completionRate(analytics.getCompletionRate())
                .pomodorosCompleted(analytics.getPomodorosCompleted())
                .focusMinutes(analytics.getFocusMinutes())
                .breakMinutes(analytics.getBreakMinutes())
                .interruptedSessions(analytics.getInterruptedSessions())
                .morningFocusMinutes(analytics.getMorningFocusMinutes())
                .afternoonFocusMinutes(analytics.getAfternoonFocusMinutes())
                .eveningFocusMinutes(analytics.getEveningFocusMinutes())
                .nightFocusMinutes(analytics.getNightFocusMinutes())
                .productivityScore(analytics.getProductivityScore())
                .focusScore(analytics.getFocusScore())
                .burnoutRiskScore(analytics.getBurnoutRiskScore())
                .lateNightSessions(analytics.getLateNightSessions())
                .overworkMinutes(analytics.getOverworkMinutes())
                .consecutiveWorkDays(analytics.getConsecutiveWorkDays())
                .urgentImportantCount(analytics.getUrgentImportantCount())
                .notUrgentImportantCount(analytics.getNotUrgentImportantCount())
                .urgentNotImportantCount(analytics.getUrgentNotImportantCount())
                .notUrgentNotImportantCount(analytics.getNotUrgentNotImportantCount())
                .build();
    }
}
