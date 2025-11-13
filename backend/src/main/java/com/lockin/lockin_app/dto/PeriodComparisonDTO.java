package com.lockin.lockin_app.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Comparison between two time periods
 *
 * Shows both absolute values and percentage changes.
 * Percentage changes are calculated as: ((new - old) / old) * 100
 *
 * Positive values indicate improvement (more tasks, higher scores)
 * Negative values indicate decline
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PeriodComparisonDTO {
    private PeriodSummaryDTO currentPeriod;
    private PeriodSummaryDTO previousPeriod;

    // Percentage changes (positive = improvement, negative = decline)
    private Double tasksCreatedChange;      // % change in tasks created
    private Double tasksCompletedChange;    // % change in tasks completed
    private Double completionRateChange;    // % change in completion rate

    private Double pomodorosChange;         // % change in pomodoros
    private Double focusMinutesChange;      // % change in focus time

    private Double productivityChange;      // % change in productivity score
    private Double focusScoreChange;        // % change in focus score
    private Double burnoutRiskChange;       // % change in burnout risk (negative is good!)

    /**
     * Overall trend indicator
     * "improving" - most metrics getting better
     * "declining" - most metrics getting worse
     * "stable" - mixed or small changes
     */
    private String trend;
}
