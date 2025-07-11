package com.lockin.lockin_app.controller;

import com.lockin.lockin_app.dto.ComparisonDTO;
import com.lockin.lockin_app.dto.DailyAnalyticsDTO;
import com.lockin.lockin_app.dto.DateRangeDTO;
import com.lockin.lockin_app.dto.WeeklyReportDTO;
import com.lockin.lockin_app.entity.User;
import com.lockin.lockin_app.repository.UserRepository;
import com.lockin.lockin_app.service.AnalyticsCalculationService;
import com.lockin.lockin_app.service.UserService;
import com.lockin.lockin_app.service.WeeklyReportService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@Slf4j
@RestController
@RequestMapping("/api/analytics")
@RequiredArgsConstructor
public class DailyAnalyticsController {

    private final AnalyticsCalculationService calculationService;
    private final UserService userService;
    private final WeeklyReportService weeklyReportService;
    private final UserRepository userRepository;

    @GetMapping("/today")
    public ResponseEntity<DailyAnalyticsDTO> getTodayAnalytics(
            @AuthenticationPrincipal UserDetails userDetails) {

        log.debug("GET /api/analytics/today: User: {}", userDetails.getUsername());

        Long userId = userService.getUserIdFromEmail(userDetails.getUsername());
        LocalDate today = LocalDate.now();

        DailyAnalyticsDTO analytics = calculationService.calculateDailyAnalytics(userId, today);

        return ResponseEntity.ok(analytics);
    }

    @GetMapping("/range")
    public ResponseEntity<List<DailyAnalyticsDTO>> getAnalyticsRange(
            @RequestParam int days, @AuthenticationPrincipal UserDetails userDetails) {

        log.debug("GET /api/analytics/range?days={}: User: {}", days, userDetails.getUsername());

        Long userId = userService.getUserIdFromEmail(userDetails.getUsername());

        LocalDate endDate = LocalDate.now();
        LocalDate startDate = endDate.minusDays(days - 1);

        List<DailyAnalyticsDTO> analyticsList = new java.util.ArrayList<>();

        for (LocalDate date = startDate; !date.isAfter(endDate); date = date.plusDays(1)) {
            DailyAnalyticsDTO analytics = calculationService.calculateDailyAnalytics(userId, date);
            analyticsList.add(analytics);
        }

        return ResponseEntity.ok(analyticsList);
    }

    @PostMapping("/calculate/{date}")
    public ResponseEntity<DailyAnalyticsDTO> calculateForDate(
            @PathVariable String date, @AuthenticationPrincipal UserDetails userDetails) {

        log.debug("POST /api/analytics/calculate/{}: User: {}", date, userDetails.getUsername());

        Long userId = userService.getUserIdFromEmail(userDetails.getUsername());
        LocalDate targetDate = LocalDate.parse(date);

        DailyAnalyticsDTO analytics =
                calculationService.calculateDailyAnalytics(userId, targetDate);

        return ResponseEntity.ok(analytics);
    }

    @GetMapping("/weekly-report")
    public ResponseEntity<WeeklyReportDTO> getWeeklyReport(
            @AuthenticationPrincipal UserDetails userDetails) {

        log.debug("GET /api/analytics/weekly-report: User: {}", userDetails.getUsername());

        User user = userService.getUserByEmail(userDetails.getUsername());

        WeeklyReportDTO report = weeklyReportService.generateWeeklyReport(user);

        if (report == null || report.getRecommendations() == null) {
            log.info("No data available for weekly report for user {}", user.getEmail());
            return ResponseEntity.noContent().build();
        }

        return ResponseEntity.ok(report);
    }

    @PostMapping("/compare")
    public ResponseEntity<ComparisonDTO> comparePeriodsre(
            @RequestBody DateRangeDTO request, @AuthenticationPrincipal UserDetails userDetails) {

        log.debug("POST /api/analytics/compare: User: {}", userDetails.getUsername());

        Long userId = userService.getUserIdFromEmail(userDetails.getUsername());

        DailyAnalyticsDTO current =
                calculationService.getAverageForPeriod(
                        userId, request.getCurrentStart(), request.getCurrentEnd());

        DailyAnalyticsDTO previous =
                calculationService.getAverageForPeriod(
                        userId, request.getPreviousStart(), request.getPreviousEnd());

        ComparisonDTO comparison = new ComparisonDTO();
        comparison.setCurrent(current);
        comparison.setPrevious(previous);

        comparison.setTasksChange(
                calculatePercentageChange(
                        previous.getTasksCompleted(), current.getTasksCompleted()));
        comparison.setProductivityChange(
                calculatePercentageChange(
                        previous.getProductivityScore(), current.getProductivityScore()));
        comparison.setFocusChange(
                calculatePercentageChange(previous.getFocusMinutes(), current.getFocusMinutes()));
        comparison.setBurnoutChange(
                calculatePercentageChange(
                        previous.getBurnoutRiskScore(), current.getBurnoutRiskScore()));

        comparison.setTasksTrend(getTrend(comparison.getTasksChange()));
        comparison.setProductivityTrend(getTrend(comparison.getProductivityChange()));
        comparison.setFocusTrend(getTrend(comparison.getFocusChange()));
        comparison.setBurnoutTrend(getTrend(comparison.getBurnoutChange()));

        return ResponseEntity.ok(comparison);
    }

    private Double calculatePercentageChange(Number oldValue, Number newValue) {
        if (oldValue == null || newValue == null) {
            return 0.0;
        }
        double old = oldValue.doubleValue();
        double newVal = newValue.doubleValue();
        if (old == 0) {
            return newVal > 0 ? 100.0 : 0.0;
        }
        return ((newVal - old) / old) * 100;
    }

    private String getTrend(Double change) {
        if (change == null || Math.abs(change) < 5) {
            return "stable";
        }
        return change > 0 ? "up" : "down";
    }
}
