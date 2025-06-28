package com.lockin.lockin_app.dto;

import com.lockin.lockin_app.entity.DailyAnalytics;

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

    public static WeeklyReportDTO fromCalculatedData(
            LocalDate weekStart,
            LocalDate weekEnd,
            Integer totalTasks,
            Integer totalPomodoros,
            Integer totalMinutes,
            Double avgProductivity,
            Double avgBurnout,
            DayHighlight bestDay,
            DayHighlight worstDay,
            String productivityTrend,
            String focusTrend,
            List<String> recommendations) {

        return WeeklyReportDTO.builder()
                .weekStart(weekStart)
                .weekEnd(weekEnd)
                .totalTasksCompleted(totalTasks)
                .totalPomodoros(totalPomodoros)
                .totalFocusMinutes(totalMinutes)
                .averageProductivityScore(round(avgProductivity))
                .averageBurnoutRisk(round(avgBurnout))
                .bestDay(bestDay)
                .worstDay(worstDay)
                .productivityTrend(productivityTrend)
                .focusTrend(focusTrend)
                .recommendations(recommendations)
                .build();
    }

    public static WeeklyReportDTO createEmpty(LocalDate weekStart, LocalDate weekEnd) {
        return WeeklyReportDTO.builder()
                .weekStart(weekStart)
                .weekEnd(weekEnd)
                .totalTasksCompleted(0)
                .totalPomodoros(0)
                .totalFocusMinutes(0)
                .averageProductivityScore(0.0)
                .averageBurnoutRisk(0.0)
                .bestDay(null)
                .worstDay(null)
                .productivityTrend("STABLE")
                .focusTrend("STABLE")
                .recommendations(List.of("Start tracking your productivity!"))
                .build();
    }
    
    private static double round(double value) {
        return Math.round(value * 100.0) / 100.0;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DayHighlight {
        private LocalDate date;
        private Double score;
        private String reason;

        public static DayHighlight fromEntity(DailyAnalytics entity, String reason) {
            if (entity == null) {
                return null;
            }
            return DayHighlight.builder()
                    .date(entity.getDate())
                    .score(entity.getProductivityScore())
                    .reason(reason)
                    .build();
        }
    }
}
