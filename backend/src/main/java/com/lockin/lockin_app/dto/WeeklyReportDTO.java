package com.lockin.lockin_app.dto;

import lombok.*;

import java.time.LocalDate;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WeeklyReportDTO {
    private LocalDate weekStart;
    private LocalDate weekEnd;

    private Integer totalTasksCompleted;
    private Integer totalPomodoros;
    private Integer totalFocusMinutes;
    private Double averageProductivityScore;
    private Double averageBurnoutRisk;

    private DayHighlight bestDay;
    private DayHighlight worstDay;
    private String productivityTrend;
    private String focusTrend;
    private List<String> recommendations;

    @Data
    @Builder
    public static class DayHighlight {
        private LocalDate date;
        private Double score;
        private String reason;
    }
}
