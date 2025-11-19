package com.lockin.lockin_app.features.analytics.controller;

import com.lockin.lockin_app.features.analytics.dto.ComparisonDTO;
import com.lockin.lockin_app.features.analytics.dto.DailyAnalyticsDTO;
import com.lockin.lockin_app.shared.dto.DateRangeDTO;
import com.lockin.lockin_app.features.analytics.dto.WeeklyReportDTO;
import com.lockin.lockin_app.features.users.entity.User;
import com.lockin.lockin_app.features.analytics.service.AnalyticsCalculationService;
import com.lockin.lockin_app.features.analytics.service.ComparisonService;
import com.lockin.lockin_app.features.analytics.service.StreakService;
import com.lockin.lockin_app.features.users.service.UserService;
import com.lockin.lockin_app.features.analytics.service.WeeklyReportService;
import com.lockin.lockin_app.shared.controller.BaseController;

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
public class DailyAnalyticsController extends BaseController {

    private final AnalyticsCalculationService calculationService;
    private final WeeklyReportService weeklyReportService;
    private final StreakService streakService;
    private final ComparisonService comparisonService;

    public DailyAnalyticsController(UserService userService,
                                    AnalyticsCalculationService calculationService,
                                    WeeklyReportService weeklyReportService,
                                    StreakService streakService,
                                    ComparisonService comparisonService) {
        super(userService);
        this.calculationService = calculationService;
        this.weeklyReportService = weeklyReportService;
        this.streakService = streakService;
        this.comparisonService = comparisonService;
    }

    @GetMapping("/today")
    public ResponseEntity<DailyAnalyticsDTO> getTodayAnalytics(
            @AuthenticationPrincipal UserDetails userDetails) {

        log.debug("GET /api/analytics/today: User: {}", getCurrentUserEmail(userDetails));

        Long userId = getCurrentUserId(userDetails);
        LocalDate today = LocalDate.now();

        DailyAnalyticsDTO analytics = calculationService.calculateDailyAnalytics(userId, today);

        return ResponseEntity.ok(analytics);
    }

    @GetMapping("/range")
    public ResponseEntity<List<DailyAnalyticsDTO>> getAnalyticsRange(
            @RequestParam int days, @AuthenticationPrincipal UserDetails userDetails) {

        log.debug("GET /api/analytics/range?days={}: User: {}", days, getCurrentUserEmail(userDetails));

        Long userId = getCurrentUserId(userDetails);

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

        log.debug("POST /api/analytics/calculate/{}: User: {}", date, getCurrentUserEmail(userDetails));

        Long userId = getCurrentUserId(userDetails);
        LocalDate targetDate = LocalDate.parse(date);

        DailyAnalyticsDTO analytics =
                calculationService.calculateDailyAnalytics(userId, targetDate);

        return ResponseEntity.ok(analytics);
    }

    @GetMapping("/weekly-report")
    public ResponseEntity<WeeklyReportDTO> getWeeklyReport(
            @AuthenticationPrincipal UserDetails userDetails) {

        log.debug("GET /api/analytics/weekly-report: User: {}", getCurrentUserEmail(userDetails));

        User user = userService.getUserByEmail(getCurrentUserEmail(userDetails));

        WeeklyReportDTO report = weeklyReportService.generateWeeklyReport(user);

        if (report == null || report.getRecommendations() == null) {
            log.info("No data available for weekly report for user {}", user.getEmail());
            return ResponseEntity.noContent().build();
        }

        return ResponseEntity.ok(report);
    }

    @PostMapping("/compare")
    public ResponseEntity<ComparisonDTO> comparePeriods(
            @RequestBody DateRangeDTO request, @AuthenticationPrincipal UserDetails userDetails) {

        log.debug("POST /api/analytics/compare: User: {}", getCurrentUserEmail(userDetails));

        Long userId = getCurrentUserId(userDetails);

        DailyAnalyticsDTO current =
                calculationService.getAverageForPeriod(
                        userId, request.getCurrentStart(), request.getCurrentEnd());

        DailyAnalyticsDTO previous =
                calculationService.getAverageForPeriod(
                        userId, request.getPreviousStart(), request.getPreviousEnd());

        ComparisonDTO comparison = comparisonService.createComparison(current, previous);

        return ResponseEntity.ok(comparison);
    }

    @PostMapping("/refresh")
    public ResponseEntity<Void> refreshAnalytics(@AuthenticationPrincipal UserDetails userDetails) {

        log.debug("POST /api/analytics/refresh: User: {}", getCurrentUserEmail(userDetails));

        Long userId = getCurrentUserId(userDetails);

        calculationService.invalidateCache(userId, LocalDate.now());

        log.info("Analytics cache invalidated for user {}", userId);

        return ResponseEntity.ok().build();
    }

    @GetMapping("/streak")
    public ResponseEntity<StreakService.StreakStats> getStreak(
            @AuthenticationPrincipal UserDetails userDetails) {

        log.debug("GET /api/analytics/streak: User: {}", getCurrentUserEmail(userDetails));

        Long userId = getCurrentUserId(userDetails);

        // Update streak based on today's activity
        streakService.updateStreak(userId);

        StreakService.StreakStats stats = streakService.getStreakStats(userId);

        return ResponseEntity.ok(stats);
    }
}
