package com.lockin.lockin_app.service;

import com.lockin.lockin_app.dto.DailyAnalyticsDTO;
import com.lockin.lockin_app.entity.*;
import com.lockin.lockin_app.repository.DailyAnalyticsRepository;
import com.lockin.lockin_app.repository.FocusSessionRepository;
import com.lockin.lockin_app.repository.TaskRepository;
import com.lockin.lockin_app.repository.UserRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.*;
import java.util.List;

/** Calculates daily analytics metrics Research-based algorithms for productivity scoring */
@Slf4j
@Service
@RequiredArgsConstructor
public class AnalyticsCalculationService {

    private final TaskRepository taskRepository;
    private final FocusSessionRepository focusSessionRepository;
    private final DailyAnalyticsRepository dailyAnalyticsRepository;
    private final UserRepository userRepository;

    // Research-based constants
    private static final int OPTIMAL_FOCUS_MINUTES = 240;
    private static final int MAX_HEALTHY_MINUTES = 360;
    private static final int LATE_NIGHT_HOUR = 22;

    /**
     * Calculates daily analytics for a specific date
     *
     * <p>Scoring algorithms based on: - Productivity: 40% task completion + 40% focus time + 20%
     * work-break balance - Burnout risk: Overwork, late night sessions, interruption rate - Focus:
     * Optimal range 240min, diminishing returns after 360min
     *
     * @param userId user to calculate analytics for
     * @param date specific date to analyze
     * @return daily analytics with scores and metrics
     */
    @Transactional
    public DailyAnalyticsDTO calculateDailyAnalytics(Long userId, LocalDate date) {
        long startTime = System.currentTimeMillis();
        log.debug("🕐 Starting analytics calculation for user {} on {}", userId, date);

        User user =
                userRepository
                        .findById(userId)
                        .orElseThrow(() -> new RuntimeException("User not found"));

        log.info(
                "Calculating analytics for {} {} on {}",
                user.getFirstName(),
                user.getLastName(),
                date);

        DailyAnalytics existing =
                dailyAnalyticsRepository.findByUserAndDate(user, date).orElse(null);

        DailyAnalytics analytics = existing != null ? existing : new DailyAnalytics();
        analytics.setUser(user);
        analytics.setDate(date);

        // calculate all metrics
        calculateTaskMetrics(analytics, user, date);
        calculatePomodoroMetrics(analytics, user, date);
        calculateEisenhowerDistribution(analytics, user, date);
        calculateScores(analytics);

        DailyAnalytics saved = dailyAnalyticsRepository.save(analytics);

        long endTime = System.currentTimeMillis();
        long duration = endTime - startTime;
        log.info("✅ Analytics calculated in {}ms (user={}, date={})", duration, userId, date);

        // Performance monitoring: Log slow queries for investigation
        if (duration > 200) {
            log.warn("⚠️  Slow analytics calculation: {}ms (threshold: 200ms)", duration);
        }

        return DailyAnalyticsDTO.fromEntity(saved);
    }

    // counts tasks created and completed on the given date
    private void calculateTaskMetrics(DailyAnalytics analytics, User user, LocalDate date) {
        long methodStart = System.currentTimeMillis();

        // WIP: Trying JOIN FETCH to optimize loading
        // Hypothesis: Eager loading relationships will reduce queries
        // UPDATE: This doesn't actually solve the problem!
        // We're still loading ALL tasks, just with their relationships
        // The real issue is filtering by date in Java, not lazy loading
        List<Task> allTasks = taskRepository.findByUserIdWithRelations(user.getId());
        log.debug("📊 Loaded {} tasks for user {} in {}ms",
                allTasks.size(), user.getId(), System.currentTimeMillis() - methodStart);

        LocalDateTime startOfDay = date.atStartOfDay();
        LocalDateTime endOfDay = date.plusDays(1).atStartOfDay();

        int created = 0;
        int completed = 0;

        for (Task task : allTasks) {
            if (task.getCreatedAt() != null
                    && task.getCreatedAt().isAfter(startOfDay)
                    && task.getCreatedAt().isBefore(endOfDay)) {

                created++;

                if (task.getStatus() == TaskStatus.COMPLETED
                        && task.getUpdatedAt() != null
                        && task.getUpdatedAt().isAfter(startOfDay)
                        && task.getUpdatedAt().isBefore(endOfDay)) {

                    completed++;
                }
            }
        }

        analytics.setTasksCreated(created);
        analytics.setTasksCompleted(completed);
        analytics.setTasksDeleted(0);

        double completionRate = created > 0 ? (completed / (double) created) * 100 : 0.0;
        analytics.setCompletionRate(Math.round(completionRate * 100.0) / 100.0);

        log.debug("📈 Task metrics calculated in {}ms (created={}, completed={})",
                System.currentTimeMillis() - methodStart, created, completed);
    }

    /**
     * Calculates Pomodoro session metrics
     *
     * <p>Includes focus minutes, break minutes, interrupted sessions and late night work detection
     * (sessions after 10 PM).
     */
    private void calculatePomodoroMetrics(DailyAnalytics analytics, User user, LocalDate date) {
        long methodStart = System.currentTimeMillis();

        LocalDateTime startOfDay = date.atStartOfDay();
        LocalDateTime endOfDay = date.atTime(23, 59, 59);

        List<FocusSession> sessions =
                focusSessionRepository.findByUserAndStartedAtBetween(user, startOfDay, endOfDay);

        log.debug("🎯 Loaded {} focus sessions for user {} in {}ms",
                sessions.size(), user.getId(), System.currentTimeMillis() - methodStart);

        int completed = 0;
        int totalFocusMinutes = 0;
        int totalBreakMinutes = 0;
        int interrupted = 0;
        int lateNight = 0;

        for (FocusSession session : sessions) {
            if (session.getCompleted()) {
                completed++;
                totalFocusMinutes += session.getWorkDuration();

                if (session.getBreakMinutes() != null) {
                    totalBreakMinutes += session.getBreakMinutes();
                }
            } else {
                interrupted++;
            }

            if (session.getStartedAt().getHour() >= LATE_NIGHT_HOUR) {
                lateNight++;
            }
        }

        analytics.setPomodorosCompleted(completed);
        analytics.setFocusMinutes(totalFocusMinutes);
        analytics.setBreakMinutes(totalBreakMinutes);
        analytics.setInterruptedSessions(interrupted);
        analytics.setLateNightSessions(lateNight);

        int overwork = Math.max(0, totalFocusMinutes - MAX_HEALTHY_MINUTES);
        analytics.setOverworkMinutes(overwork);

        log.debug("⏱️  Pomodoro metrics calculated in {}ms (completed={}, focus={}min)",
                System.currentTimeMillis() - methodStart, completed, totalFocusMinutes);
    }

    // counts current tasks by Eisenhower matrix quadrant
    private void calculateEisenhowerDistribution(
            DailyAnalytics analytics, User user, LocalDate date) {
        // TODO: PERFORMANCE ISSUE - Same N+1 problem as calculateTaskMetrics
        // Loading ALL tasks again! This is the second time in the same method call
        // We should either: 1) Pass tasks as parameter, or 2) Add caching, or 3) Combine queries
        List<Task> allTasks = taskRepository.findByUserId(user.getId());

        int urgentImportant = 0;
        int notUrgentImportant = 0;
        int urgentNotImportant = 0;
        int notUrgentNotImportant = 0;

        for (Task task : allTasks) {
            if (task.getStatus() != TaskStatus.COMPLETED) {

                if (task.getIsUrgent() && task.getIsImportant()) {
                    urgentImportant++;
                } else if (!task.getIsUrgent() && task.getIsImportant()) {
                    notUrgentImportant++;
                } else if (task.getIsUrgent() && !task.getIsImportant()) {
                    urgentNotImportant++;
                } else {
                    notUrgentNotImportant++;
                }
            }
        }

        analytics.setUrgentImportantCount(urgentImportant);
        analytics.setNotUrgentImportantCount(notUrgentImportant);
        analytics.setUrgentNotImportantCount(urgentNotImportant);
        analytics.setNotUrgentNotImportantCount(notUrgentNotImportant);
    }

    private void calculateScores(DailyAnalytics analytics) {
        int focusMinutes = analytics.getFocusMinutes();
        double focusScore = calculateFocusScore(focusMinutes);
        analytics.setFocusScore(focusScore);

        calculateProductivityScore(analytics);
        calculateBurnoutRisk(analytics);

        log.debug(
                "Scores calculated - Productivity: {}, Focus: {}, Burnout: {}",
                analytics.getProductivityScore(),
                analytics.getFocusScore(),
                analytics.getBurnoutRiskScore());
    }

    /**
     * Calculates focus score based on minutes worked
     *
     * <p>Optimal zone: 240 minutes (100 points) Diminishing returns: 240-360 minutes (100-80
     * points) Over-focus penalty: >360 minutes (decreasing below 80)
     */
    private double calculateFocusScore(int focusMinutes) {
        double score;

        if (focusMinutes <= OPTIMAL_FOCUS_MINUTES) {
            score = (focusMinutes / (double) OPTIMAL_FOCUS_MINUTES) * 100;
        } else if (focusMinutes <= MAX_HEALTHY_MINUTES) {
            double excessRatio =
                    (focusMinutes - OPTIMAL_FOCUS_MINUTES)
                            / (double) (MAX_HEALTHY_MINUTES - OPTIMAL_FOCUS_MINUTES);
            score = 100 - (excessRatio * 20);
        } else {
            double excessHours = (focusMinutes - MAX_HEALTHY_MINUTES) / 60.0;
            score = 80 - (excessHours * 20);
        }

        return Math.max(0, Math.min(100, score));
    }

    /**
     * Calculates burnout risk score (0-100)
     *
     * <p>Risk factors weighted: - Overwork: 40 points max (>60 min over limit) - Late night: 30
     * points max (2+ sessions after 10 PM) - Interruptions: 20 points max (>50% interrupted) - Low
     * productivity: 10 points (score <30) - Consecutive days: 10 points (7+ days straight)
     */
    private void calculateBurnoutRisk(DailyAnalytics analytics) {
        double riskScore = 0;

        // overwork indicator (0-40 points)
        if (analytics.getOverworkMinutes() > 60) {
            riskScore += Math.min(40, analytics.getOverworkMinutes() / 6.0);
        }

        // late night work (0-30 points)
        if (analytics.getLateNightSessions() >= 2) {
            riskScore += Math.min(30, (analytics.getLateNightSessions() - 1) * 10);
        }

        // interrupted sessions (0-20 points)
        int totalSessions = analytics.getPomodorosCompleted() + analytics.getInterruptedSessions();
        if (totalSessions > 0) {
            double interruptRate = analytics.getInterruptedSessions() / (double) totalSessions;
            if (interruptRate > 0.5) {
                riskScore += (interruptRate - 0.5) * 40;
            }
        }

        // low productivity as burnout indicator (0-10 points)
        if (analytics.getProductivityScore() < 30) {
            riskScore += 10;
        }

        // consecutive work days (0-10 points)
        if (analytics.getConsecutiveWorkDays() >= 7) {
            riskScore += Math.min(10, (analytics.getConsecutiveWorkDays() - 6) * 2);
        }

        analytics.setBurnoutRiskScore(Math.min(100, riskScore));

        log.debug("Burnout risk calculated: {} points", riskScore);
    }

    /**
     * Calculates overall productivity score (0-100)
     *
     * <p>Weighted formula: - Task completion: 40% (completion rate * 0.4) - Focus time: 40%
     * (optimal at 240 min) - Work-break balance: 20% (ideal ratio 0.15-0.25)
     */
    private void calculateProductivityScore(DailyAnalytics analytics) {
        double taskScore = 0;
        double focusScore = 0;
        double balanceScore = 0;

        // 1. Task completion (40% weight)
        taskScore = Math.min(40, analytics.getCompletionRate() * 0.4);

        // 2. Focus time (40% weight)
        int focusMinutes = analytics.getFocusMinutes();
        if (focusMinutes == 0) {
            focusScore = 0;
        } else if (focusMinutes <= OPTIMAL_FOCUS_MINUTES) {
            focusScore = (focusMinutes / (double) OPTIMAL_FOCUS_MINUTES) * 40;
        } else {
            int excessMinutes = focusMinutes - OPTIMAL_FOCUS_MINUTES;
            double excessScore = 40 - (excessMinutes / 30.0); // lose 1 point per 30 min excess
            focusScore = Math.max(25, excessScore); // floor at 25 for actually working
        }

        // 3.Work-Break balance score (20% weight)
        int breakMinutes = analytics.getBreakMinutes();
        if (focusMinutes > 0 && breakMinutes > 0) {
            double ratio = breakMinutes / (double) focusMinutes;
            if (ratio >= 0.15 && ratio <= 0.25) {
                balanceScore = 20;
            } else if (ratio >= 0.10 && ratio <= 0.30) {
                balanceScore = 15;
            } else if (ratio >= 0.05 && ratio <= 0.35) {
                balanceScore = 10;
            } else {
                balanceScore = 5;
            }
        } else if (focusMinutes > 0) {
            balanceScore = 5;
        }

        double totalScore = taskScore + focusScore + balanceScore;
        analytics.setProductivityScore(Math.min(100, Math.max(0, totalScore)));

        analytics.setFocusScore(Math.min(100, focusScore * 2.5));

        log.debug(
                "Productivity breakdown - Task: {}, Focus: {}, Balance: {}, Total: {}",
                taskScore,
                focusScore,
                balanceScore,
                totalScore);
    }
    // TODO: implement consecutive work days calculation
    // TODO: add weekly/monthly aggregation
}
