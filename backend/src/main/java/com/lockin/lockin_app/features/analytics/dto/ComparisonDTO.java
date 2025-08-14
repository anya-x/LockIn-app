package com.lockin.lockin_app.features.analytics.dto;

import lombok.Data;

@Data
public class ComparisonDTO {
    private DailyAnalyticsDTO current;
    private DailyAnalyticsDTO previous;

    // percentage changes
    private Double tasksChange;
    private Double productivityChange;
    private Double focusChange;
    private Double burnoutChange;

    private String tasksTrend; // up, down, stable
    private String productivityTrend;
    private String focusTrend;
    private String burnoutTrend;
}
