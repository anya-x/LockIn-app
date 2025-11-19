package com.lockin.lockin_app.scheduler;

import com.lockin.lockin_app.entity.User;
import com.lockin.lockin_app.repository.AIUsageRepository;
import com.lockin.lockin_app.repository.DailyAnalyticsRepository;
import com.lockin.lockin_app.repository.UserRepository;
import com.lockin.lockin_app.service.AnalyticsCalculationService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class DailyAnalyticsScheduler {

    private final AnalyticsCalculationService calculationService;
    private final UserRepository userRepository;
    private final DailyAnalyticsRepository dailyAnalyticsRepository;
    private final AIUsageRepository aiUsageRepository;

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

    /**
     * Cleanup old analytics data to prevent database bloat.
     *
     * Runs at 3:30 AM daily (after analytics calculation completes).
     * Keeps 90 days of analytics, deletes older records.
     */
    @Scheduled(cron = "0 30 3 * * ?")
    @Transactional
    public void cleanupOldAnalytics() {
        log.info("Starting analytics cleanup");

        LocalDate cutoffDate = LocalDate.now().minusDays(90);

        try {
            int deletedCount = dailyAnalyticsRepository.deleteByDateBefore(cutoffDate);
            log.info("Analytics cleanup complete. Deleted {} records older than {}",
                    deletedCount, cutoffDate);
        } catch (Exception e) {
            log.error("Analytics cleanup failed: {}", e.getMessage(), e);
        }
    }

    /**
     * Cleanup old AI usage records for cost tracking.
     *
     * Runs at 4:00 AM every Sunday (weekly).
     * Keeps 6 months of AI usage data for cost analysis, deletes older records.
     */
    @Scheduled(cron = "0 0 4 * * SUN")
    @Transactional
    public void cleanupOldAIUsage() {
        log.info("Starting AI usage cleanup");

        LocalDateTime cutoffDate = LocalDateTime.now().minusMonths(6);

        try {
            int deletedCount = aiUsageRepository.deleteByCreatedAtBefore(cutoffDate);
            log.info("AI usage cleanup complete. Deleted {} records older than {}",
                    deletedCount, cutoffDate);
        } catch (Exception e) {
            log.error("AI usage cleanup failed: {}", e.getMessage(), e);
        }
    }
}
