package com.lockin.lockin_app.dto;

import lombok.*;

import java.time.DayOfWeek;

/**
 * DTO for productivity insights based on statistical analysis
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductivityInsightsDTO {
    private DayOfWeek mostProductiveDay;
    private String bestTimeOfDay;
    private Integer averageSessionLength;
    private Double completionRateTrend;
    private Double averageProductivityScore;
    private Integer totalDaysAnalyzed;

    private static double round(double value) {
        return Math.round(value * 100.0) / 100.0;
    }
}
