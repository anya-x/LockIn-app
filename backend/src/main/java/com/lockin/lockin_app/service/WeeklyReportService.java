package com.lockin.lockin_app.service;

import com.lockin.lockin_app.dto.WeeklyReportDTO;
import com.lockin.lockin_app.entity.DailyAnalytics;
import com.lockin.lockin_app.entity.User;
import com.lockin.lockin_app.repository.DailyAnalyticsRepository;

import lombok.*;

import org.springframework.stereotype.Service;

import java.time.*;
import java.util.*;

@Service
@RequiredArgsConstructor
public class WeeklyReportService {

    private final DailyAnalyticsRepository dailyAnalyticsRepository;

    public WeeklyReportDTO generateWeeklyReport(User user) {
        LocalDate today = LocalDate.now();
        LocalDate weekStart = today.minusDays(7);

        List<DailyAnalytics> weekData =
                dailyAnalyticsRepository.findByUserAndDateBetweenOrderByDateDesc(
                        user, weekStart, today);

        if (weekData.isEmpty()) {
            return null;
        }

        int totalTasks = weekData.stream().mapToInt(DailyAnalytics::getTasksCompleted).sum();

        int totalPomodoros =
                weekData.stream().mapToInt(DailyAnalytics::getPomodorosCompleted).sum();

        int totalFocusMinutes = weekData.stream().mapToInt(DailyAnalytics::getFocusMinutes).sum();

        double avgProductivity =
                weekData.stream()
                        .mapToDouble(DailyAnalytics::getProductivityScore)
                        .average()
                        .orElse(0.0);

        double avgBurnout =
                weekData.stream()
                        .mapToDouble(DailyAnalytics::getBurnoutRiskScore)
                        .average()
                        .orElse(0.0);

        // best and worst days
        DailyAnalytics bestDay =
                weekData.stream()
                        .max(Comparator.comparingDouble(DailyAnalytics::getProductivityScore))
                        .orElse(null);

        DailyAnalytics worstDay =
                weekData.stream()
                        .min(Comparator.comparingDouble(DailyAnalytics::getProductivityScore))
                        .orElse(null);

        // detect trends (first half v second half)
        String productivityTrend = detectTrend(weekData, DailyAnalytics::getProductivityScore);
        String focusTrend = detectTrend(weekData, d -> (double) d.getFocusMinutes());

        // recommendations
        List<String> recommendations =
                generateRecommendations(avgProductivity, avgBurnout, totalFocusMinutes, weekData);

        return WeeklyReportDTO.builder()
                .weekStart(weekStart)
                .weekEnd(today)
                .totalTasksCompleted(totalTasks)
                .totalPomodoros(totalPomodoros)
                .totalFocusMinutes(totalFocusMinutes)
                .averageProductivityScore(avgProductivity)
                .averageBurnoutRisk(avgBurnout)
                .bestDay(
                        bestDay != null
                                ? WeeklyReportDTO.DayHighlight.builder()
                                        .date(bestDay.getDate())
                                        .score(bestDay.getProductivityScore())
                                        .reason("Highest productivity")
                                        .build()
                                : null)
                .worstDay(
                        worstDay != null
                                ? WeeklyReportDTO.DayHighlight.builder()
                                        .date(worstDay.getDate())
                                        .score(worstDay.getProductivityScore())
                                        .reason("Lowest productivity")
                                        .build()
                                : null)
                .productivityTrend(productivityTrend)
                .focusTrend(focusTrend)
                .recommendations(recommendations)
                .build();
    }

    private String detectTrend(
            List<DailyAnalytics> data,
            java.util.function.ToDoubleFunction<DailyAnalytics> extractor) {
        if (data.size() < 4) return "STABLE";

        int mid = data.size() / 2;
        double firstHalf = data.subList(0, mid).stream().mapToDouble(extractor).average().orElse(0);
        double secondHalf =
                data.subList(mid, data.size()).stream().mapToDouble(extractor).average().orElse(0);

        double change = ((secondHalf - firstHalf) / firstHalf) * 100;

        if (change > 10) return "IMPROVING";
        if (change < -10) return "DECLINING";
        return "STABLE";
    }

    private List<String> generateRecommendations(
            double avgProductivity,
            double avgBurnout,
            int totalFocus,
            List<DailyAnalytics> weekData) {
        List<String> recs = new ArrayList<>();

        if (avgProductivity < 50) {
            recs.add("Your productivity is below average. Try breaking tasks into smaller chunks.");
        }

        if (avgBurnout > 60) {
            recs.add(
                    "High burnout risk detected. Consider taking more breaks and reducing late-night work.");
        }

        if (totalFocus < 600) { // less than 10 hours/week
            recs.add("Low focus time this week. Try scheduling dedicated focus blocks.");
        }

        // count days with no activity
        long inactiveDays = weekData.stream().filter(d -> d.getFocusMinutes() == 0).count();

        if (inactiveDays >= 3) {
            recs.add(
                    "You had "
                            + inactiveDays
                            + " inactive days. Consistency is key to productivity.");
        }

        if (recs.isEmpty()) {
            recs.add("Great week! Keep up the consistent work.");
        }

        return recs;
    }
}
