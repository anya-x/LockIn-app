package com.lockin.lockin_app.controller;

import com.lockin.lockin_app.dto.DailyAnalyticsDTO;
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

        User user =
                userRepository
                        .findByEmail(userDetails.getUsername())
                        .orElseThrow(() -> new RuntimeException("User not found"));

        WeeklyReportDTO report = weeklyReportService.generateWeeklyReport(user);

        if (report == null) {
            log.info("No data available for weekly report for user {}", user.getEmail());
            return ResponseEntity.noContent().build();
        }

        return ResponseEntity.ok(report);
    }
}
