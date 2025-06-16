package com.lockin.lockin_app.scheduler;

import com.lockin.lockin_app.entity.User;
import com.lockin.lockin_app.repository.UserRepository;
import com.lockin.lockin_app.service.AnalyticsCalculationService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class DailyAnalyticsScheduler {

    private final AnalyticsCalculationService calculationService;
    private final UserRepository userRepository;

    @Scheduled(cron = "0 0 2 * * ?")
    public void calculateDailyAnalytics() {
        log.info("Starting scheduled analytics calculation");

        LocalDate yesterday = LocalDate.now().minusDays(1);
        List<User> allUsers = userRepository.findAll();

        int successCount = 0;
        int errorCount = 0;

        for (User user : allUsers) {
            try {
                calculationService.calculateDailyAnalytics(user.getId(), yesterday);
                successCount++;
            } catch (Exception e) {
                log.error(
                        "Failed to calculate analytics for user {}: {}",
                        user.getId(),
                        e.getMessage());
                errorCount++;
            }
        }

        log.info(
                "daily analytics calculation complete. Success: {}, Errors: {}",
                successCount,
                errorCount);
    }

    // TODO: add to calculate consecutive work days
    // TODO: add  to cleanup old analytics
}
