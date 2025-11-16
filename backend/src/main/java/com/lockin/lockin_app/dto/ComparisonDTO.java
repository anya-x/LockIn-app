package com.lockin.lockin_app.dto;

import lombok.Data;

@Data
public class ComparisonDTO {
    private DailyAnalyticsDTO current;
    private DailyAnalyticsDTO previous;

    // Percentage changes
    private Double tasksChange;
    private Double productivityChange;
    private Double focusChange;
    private Double burnoutChange;

    // Trend indicators
    private String tasksTrend; // "up", "down", or "stable"
    private String productivityTrend;
    private String focusTrend;
    private String burnoutTrend;
}
