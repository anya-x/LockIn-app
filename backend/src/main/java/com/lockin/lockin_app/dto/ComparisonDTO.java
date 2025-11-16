package com.lockin.lockin_app.dto;

import lombok.Data;
import java.time.LocalDate;

@Data
public class ComparisonDTO {
    private DailyAnalyticsDTO currentPeriod;
    private DailyAnalyticsDTO previousPeriod;

    // Percentage changes
    private Double tasksChange;
    private Double productivityChange;
    private Double focusChange;
    private Double burnoutChange;

    // TODO: Figure out better structure for this
    // TODO: Handle edge cases (division by zero, etc.)
}
