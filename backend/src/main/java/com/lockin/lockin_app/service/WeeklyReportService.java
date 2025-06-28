package com.lockin.lockin_app.service;

import com.lockin.lockin_app.dto.WeeklyReportDTO;
import com.lockin.lockin_app.entity.DailyAnalytics;
import com.lockin.lockin_app.entity.User;
import com.lockin.lockin_app.repository.DailyAnalyticsRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class WeeklyReportService {

    private final DailyAnalyticsRepository dailyAnalyticsRepository;

    @Transactional(readOnly = true)
    public WeeklyReportDTO generateWeeklyReport(User user) {
        log.debug("Generating weekly report for user: {}", user.getId());

        LocalDate weekEnd = LocalDate.now();
        LocalDate weekStart = weekEnd.minusDays(6);

        List<DailyAnalytics> weekData =
                dailyAnalyticsRepository.findByUserAndDateBetweenOrderByDateDesc(
                        user, weekStart, weekEnd);

        if (weekData == null || weekData.isEmpty()) {
            return WeeklyReportDTO.createEmpty(weekStart, weekEnd);
        }

        int totalTasks = calculateTotalTasks(weekData);
        int totalPomodoros = calculateTotalPomodoros(weekData);
        int totalMinutes = calculateTotalMinutes(weekData);
        double avgProductivity = calculateAverageProductivity(weekData);
        double avgBurnout = calculateAverageBurnout(weekData);

        WeeklyReportDTO.DayHighlight bestDay = findBestDay(weekData);
        WeeklyReportDTO.DayHighlight worstDay = findWorstDay(weekData);

        String productivityTrend = calculateProductivityTrend(weekData);
        String focusTrend = calculateFocusTrend(weekData);

        List<String> recommendations =
                generateRecommendations(avgProductivity, avgBurnout, totalMinutes, totalPomodoros);

        return WeeklyReportDTO.fromCalculatedData(
                weekStart,
                weekEnd,
                totalTasks,
                totalPomodoros,
                totalMinutes,
                avgProductivity,
                avgBurnout,
                bestDay,
                worstDay,
                productivityTrend,
                focusTrend,
                recommendations);
    }

    private int calculateTotalTasks(List<DailyAnalytics> weekData) {
        return weekData.stream().mapToInt(DailyAnalytics::getTasksCompleted).sum();
    }

    private int calculateTotalPomodoros(List<DailyAnalytics> weekData) {
        return weekData.stream().mapToInt(DailyAnalytics::getPomodorosCompleted).sum();
    }

    private int calculateTotalMinutes(List<DailyAnalytics> weekData) {
        return weekData.stream().mapToInt(DailyAnalytics::getFocusMinutes).sum();
    }

    private double calculateAverageProductivity(List<DailyAnalytics> weekData) {
        return weekData.stream()
                .mapToDouble(DailyAnalytics::getProductivityScore)
                .average()
                .orElse(0.0);
    }

    private double calculateAverageBurnout(List<DailyAnalytics> weekData) {
        return weekData.stream()
                .mapToDouble(DailyAnalytics::getBurnoutRiskScore)
                .average()
                .orElse(0.0);
    }

    private WeeklyReportDTO.DayHighlight findBestDay(List<DailyAnalytics> weekData) {
        return weekData.stream()
                .max(Comparator.comparingDouble(DailyAnalytics::getProductivityScore))
                .map(
                        day ->
                                WeeklyReportDTO.DayHighlight.fromEntity(
                                        day, "Highest productivity score"))
                .orElse(null);
    }

    private WeeklyReportDTO.DayHighlight findWorstDay(List<DailyAnalytics> weekData) {
        return weekData.stream()
                .min(Comparator.comparingDouble(DailyAnalytics::getProductivityScore))
                .map(
                        day ->
                                WeeklyReportDTO.DayHighlight.fromEntity(
                                        day, "Lowest productivity score"))
                .orElse(null);
    }

    private String calculateProductivityTrend(List<DailyAnalytics> weekData) {
        if (weekData.size() < 3) {
            return "STABLE";
        }

        double firstHalf =
                weekData.stream()
                        .limit(weekData.size() / 2)
                        .mapToDouble(DailyAnalytics::getProductivityScore)
                        .average()
                        .orElse(0);

        double secondHalf =
                weekData.stream()
                        .skip(weekData.size() / 2)
                        .mapToDouble(DailyAnalytics::getProductivityScore)
                        .average()
                        .orElse(0);

        if (secondHalf > firstHalf + 10) {
            return "IMPROVING";
        } else if (secondHalf < firstHalf - 10) {
            return "DECLINING";
        }

        return "STABLE";
    }

    private String calculateFocusTrend(List<DailyAnalytics> weekData) {
        if (weekData.size() < 3) {
            return "STABLE";
        }

        double firstHalf =
                weekData.stream()
                        .limit(weekData.size() / 2)
                        .mapToDouble(DailyAnalytics::getFocusMinutes)
                        .average()
                        .orElse(0);

        double secondHalf =
                weekData.stream()
                        .skip(weekData.size() / 2)
                        .mapToDouble(DailyAnalytics::getFocusMinutes)
                        .average()
                        .orElse(0);

        if (secondHalf > firstHalf + 30) {
            return "IMPROVING";
        } else if (secondHalf < firstHalf - 30) {
            return "DECLINING";
        }

        return "STABLE";
    }

    private List<String> generateRecommendations(
            double avgProductivity, double avgBurnout, int totalMinutes, int totalPomodoros) {

        List<String> recommendations = new ArrayList<>();

        if (avgProductivity < 50) {
            recommendations.add("Focus on completing fewer, higher-priority tasks");
        }

        if (avgBurnout > 50) {
            recommendations.add("Consider taking more breaks and avoiding late-night work");
        }

        if (totalMinutes / 7 < 180) {
            recommendations.add("Try to maintain at least 3-4 hours of focused work daily");
        }

        if (totalPomodoros / 7 < 6) {
            recommendations.add("Use the Pomodoro timer more consistently");
        }

        if (recommendations.isEmpty()) {
            recommendations.add("Great week! Keep up the good work!");
        }

        return recommendations;
    }
}
