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

        return WeeklyReportDTO.builder().weekStart(weekStart).weekEnd(today).build();
    }
}
