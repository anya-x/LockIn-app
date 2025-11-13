package com.lockin.lockin_app.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

/**
 * Aggregated analytics for a time period
 *
 * Used for comparing multiple periods (week-over-week, month-over-month, etc.)
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PeriodSummaryDTO {
    private LocalDate startDate;
    private LocalDate endDate;

    // Aggregated metrics
    private Integer totalTasksCreated;
    private Integer totalTasksCompleted;
    private Double avgCompletionRate;

    private Integer totalPomodoros;
    private Integer totalFocusMinutes;
    private Integer totalBreakMinutes;

    // Average scores
    private Double avgProductivityScore;
    private Double avgFocusScore;
    private Double avgBurnoutRisk;
}
