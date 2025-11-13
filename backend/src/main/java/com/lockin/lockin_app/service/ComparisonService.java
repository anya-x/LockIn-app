package com.lockin.lockin_app.service;

import com.lockin.lockin_app.dto.PeriodComparisonDTO;
import com.lockin.lockin_app.dto.PeriodSummaryDTO;
import com.lockin.lockin_app.entity.DailyAnalytics;
import com.lockin.lockin_app.entity.User;
import com.lockin.lockin_app.repository.DailyAnalyticsRepository;
import com.lockin.lockin_app.repository.UserRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

/**
 * Service for comparing analytics between time periods
 *
 * Uses explicit date ranges - frontend decides what to compare.
 * This is simpler and more flexible than auto-calculating periods.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ComparisonService {

    private final DailyAnalyticsRepository dailyAnalyticsRepository;
    private final UserRepository userRepository;

    /**
     * Compare two explicit time periods
     *
     * Frontend specifies both date ranges, avoiding edge case complexity.
     * Frontend can implement business logic like:
     * - This week vs last week
     * - This month vs last month
     * - Custom date ranges
     *
     * Backend just does the math.
     *
     * @param userId user to compare analytics for
     * @param currentStart start of current period
     * @param currentEnd end of current period
     * @param previousStart start of previous period
     * @param previousEnd end of previous period
     * @return comparison with percentage changes
     */
    @Transactional(readOnly = true)
    public PeriodComparisonDTO comparePeriods(
            Long userId,
            LocalDate currentStart, LocalDate currentEnd,
            LocalDate previousStart, LocalDate previousEnd) {

        log.info("Comparing periods for user {}: current({} to {}) vs previous({} to {})",
                userId, currentStart, currentEnd, previousStart, previousEnd);

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Get aggregated stats for both periods
        PeriodSummaryDTO current = getAggregatedStats(user, currentStart, currentEnd);
        PeriodSummaryDTO previous = getAggregatedStats(user, previousStart, previousEnd);

        // Calculate percentage changes
        PeriodComparisonDTO comparison = PeriodComparisonDTO.builder()
                .currentPeriod(current)
                .previousPeriod(previous)
                .tasksCreatedChange(calculatePercentageChange(
                        previous.getTotalTasksCreated(), current.getTotalTasksCreated()))
                .tasksCompletedChange(calculatePercentageChange(
                        previous.getTotalTasksCompleted(), current.getTotalTasksCompleted()))
                .completionRateChange(calculatePercentageChange(
                        previous.getAvgCompletionRate(), current.getAvgCompletionRate()))
                .pomodorosChange(calculatePercentageChange(
                        previous.getTotalPomodoros(), current.getTotalPomodoros()))
                .focusMinutesChange(calculatePercentageChange(
                        previous.getTotalFocusMinutes(), current.getTotalFocusMinutes()))
                .productivityChange(calculatePercentageChange(
                        previous.getAvgProductivityScore(), current.getAvgProductivityScore()))
                .focusScoreChange(calculatePercentageChange(
                        previous.getAvgFocusScore(), current.getAvgFocusScore()))
                .burnoutRiskChange(calculatePercentageChange(
                        previous.getAvgBurnoutRisk(), current.getAvgBurnoutRisk()))
                .trend(calculateTrend(current, previous))
                .build();

        log.debug("Comparison complete: {} trend", comparison.getTrend());
        return comparison;
    }

    /**
     * Aggregate analytics for a date range
     */
    private PeriodSummaryDTO getAggregatedStats(User user, LocalDate start, LocalDate end) {
        List<DailyAnalytics> dailyStats = dailyAnalyticsRepository
                .findByUserAndDateBetweenOrderByDateDesc(user, start, end);

        if (dailyStats.isEmpty()) {
            log.warn("No analytics data found for user {} between {} and {}",
                    user.getId(), start, end);
            // Return zeros instead of null to avoid NPE in calculations
            return PeriodSummaryDTO.builder()
                    .startDate(start)
                    .endDate(end)
                    .totalTasksCreated(0)
                    .totalTasksCompleted(0)
                    .avgCompletionRate(0.0)
                    .totalPomodoros(0)
                    .totalFocusMinutes(0)
                    .totalBreakMinutes(0)
                    .avgProductivityScore(0.0)
                    .avgFocusScore(0.0)
                    .avgBurnoutRisk(0.0)
                    .build();
        }

        // Sum up totals
        int totalTasks = dailyStats.stream()
                .mapToInt(DailyAnalytics::getTasksCreated).sum();
        int totalCompleted = dailyStats.stream()
                .mapToInt(DailyAnalytics::getTasksCompleted).sum();
        int totalPomodoros = dailyStats.stream()
                .mapToInt(DailyAnalytics::getPomodorosCompleted).sum();
        int totalFocusMinutes = dailyStats.stream()
                .mapToInt(DailyAnalytics::getFocusMinutes).sum();
        int totalBreakMinutes = dailyStats.stream()
                .mapToInt(DailyAnalytics::getBreakMinutes).sum();

        // Calculate averages
        double avgCompletion = dailyStats.stream()
                .mapToDouble(DailyAnalytics::getCompletionRate)
                .average().orElse(0.0);
        double avgProductivity = dailyStats.stream()
                .mapToDouble(DailyAnalytics::getProductivityScore)
                .average().orElse(0.0);
        double avgFocus = dailyStats.stream()
                .mapToDouble(DailyAnalytics::getFocusScore)
                .average().orElse(0.0);
        double avgBurnout = dailyStats.stream()
                .mapToDouble(DailyAnalytics::getBurnoutRiskScore)
                .average().orElse(0.0);

        return PeriodSummaryDTO.builder()
                .startDate(start)
                .endDate(end)
                .totalTasksCreated(totalTasks)
                .totalTasksCompleted(totalCompleted)
                .avgCompletionRate(avgCompletion)
                .totalPomodoros(totalPomodoros)
                .totalFocusMinutes(totalFocusMinutes)
                .totalBreakMinutes(totalBreakMinutes)
                .avgProductivityScore(avgProductivity)
                .avgFocusScore(avgFocus)
                .avgBurnoutRisk(avgBurnout)
                .build();
    }

    /**
     * Calculate percentage change between two values
     *
     * Formula: ((new - old) / old) * 100
     * Special cases:
     * - If old = 0 and new > 0: return +100% (went from nothing to something)
     * - If old = 0 and new = 0: return 0% (no change)
     */
    private Double calculatePercentageChange(Number oldValue, Number newValue) {
        if (oldValue == null || newValue == null) {
            return 0.0;
        }

        double old = oldValue.doubleValue();
        double newVal = newValue.doubleValue();

        if (old == 0) {
            return newVal > 0 ? 100.0 : 0.0;
        }

        return ((newVal - old) / old) * 100.0;
    }

    /**
     * Determine overall trend based on key metrics
     *
     * Simple heuristic:
     * - Improving: productivity up, burnout down
     * - Declining: productivity down, burnout up
     * - Stable: mixed or small changes
     */
    private String calculateTrend(PeriodSummaryDTO current, PeriodSummaryDTO previous) {
        double productivityChange = calculatePercentageChange(
                previous.getAvgProductivityScore(), current.getAvgProductivityScore());
        double burnoutChange = calculatePercentageChange(
                previous.getAvgBurnoutRisk(), current.getAvgBurnoutRisk());

        // Positive productivity and negative burnout = improving
        if (productivityChange > 5 && burnoutChange < -5) {
            return "improving";
        }
        // Negative productivity and positive burnout = declining
        if (productivityChange < -5 && burnoutChange > 5) {
            return "declining";
        }
        // Otherwise stable
        return "stable";
    }
}
