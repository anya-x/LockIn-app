package com.lockin.lockin_app.dto;

import lombok.Data;

@Data
public class ComparisonDTO {
    private DailyAnalyticsDTO currentPeriod;
    private DailyAnalyticsDTO previousPeriod;

    private Double tasksChange;
    private Double productivityChange;
    private Double focusChange;
    private Double burnoutChange;
}
