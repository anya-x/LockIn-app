package com.lockin.lockin_app.service;

import com.lockin.lockin_app.dto.DailyAnalyticsDTO;
import com.lockin.lockin_app.entity.*;
import com.lockin.lockin_app.repository.DailyAnalyticsRepository;
import com.lockin.lockin_app.repository.FocusSessionRepository;
import com.lockin.lockin_app.repository.TaskRepository;
import com.lockin.lockin_app.repository.UserRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import org.springframework.cache.annotation.Cacheable;
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

    @Transactional
    public DailyAnalyticsDTO calculateDailyAnalytics(Long userId, LocalDate date) {
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

        return DailyAnalyticsDTO.fromEntity(saved);
    }

    private void calculateTaskMetrics(DailyAnalytics analytics, User user, LocalDate date) {
        List<Task> allTasks = taskRepository.findByUserId(user.getId());

        LocalDateTime startOfDay = date.atStartOfDay();
        LocalDateTime endOfDay = date.plusDays(1).atStartOfDay();

        System.out.println("total tasks : " + allTasks.size());
        System.out.println("date: " + date);

        int created = 0;
        int completed = 0;
        int deleted = 0;

        for (Task task : allTasks) {
            System.out.println(
                    " taskId"
                            + task.getId()
                            + " created: "
                            + task.getCreatedAt()
                            + " status: "
                            + task.getStatus());

            if (task.getCreatedAt() != null
                    && task.getCreatedAt().isAfter(startOfDay)
                    && task.getCreatedAt().isBefore(endOfDay)) {

                created++;

                if (task.getStatus() == TaskStatus.COMPLETED
                        && task.getUpdatedAt() != null
                        && task.getUpdatedAt().isAfter(startOfDay)
                        && task.getUpdatedAt().isBefore(endOfDay)) {

                    completed++;

                    System.out.println("counting as completed");
                }
            }
        }

        analytics.setTasksCreated(created);
        analytics.setTasksCompleted(completed);
        analytics.setTasksDeleted(0);

        // calculate completion rate
        double completionRate = created > 0 ? (completed / (double) created) * 100 : 0.0;
        System.out.println("completion rate: " + completionRate);
        analytics.setCompletionRate(Math.round(completionRate * 100.0) / 100.0);
    }

    private void calculatePomodoroMetrics(DailyAnalytics analytics, User user, LocalDate date) {
        LocalDateTime startOfDay = date.atStartOfDay();
        LocalDateTime endOfDay = date.atTime(23, 59, 59);

        List<FocusSession> sessions =
                focusSessionRepository.findByUserAndStartedAtBetween(user, startOfDay, endOfDay);

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

            // check if late night session
            if (session.getStartedAt().getHour() >= LATE_NIGHT_HOUR) {
                lateNight++;
            }
        }

        analytics.setPomodorosCompleted(completed);
        analytics.setFocusMinutes(totalFocusMinutes);
        analytics.setBreakMinutes(totalBreakMinutes);
        analytics.setInterruptedSessions(interrupted);
        analytics.setLateNightSessions(lateNight);

        // calculate overwork
        int overwork = Math.max(0, totalFocusMinutes - MAX_HEALTHY_MINUTES);
        analytics.setOverworkMinutes(overwork);
    }

    private void calculateEisenhowerDistribution(
            DailyAnalytics analytics, User user, LocalDate date) {
        List<Task> allTasks = taskRepository.findByUserId(user.getId());

        int UrgentImportant = 0;
        int NotUrgentImportant = 0;
        int UrgentNotImportant = 0;
        int NotUrgentNotImportant = 0;

        for (Task task : allTasks) {
            if (task.getStatus() != TaskStatus.COMPLETED) {

                if (task.getIsUrgent() && task.getIsImportant()) {
                    UrgentImportant++;
                } else if (!task.getIsUrgent() && task.getIsImportant()) {
                    NotUrgentImportant++;
                } else if (task.getIsUrgent() && !task.getIsImportant()) {
                    UrgentNotImportant++;
                } else {
                    NotUrgentNotImportant++;
                }
            }
        }

        analytics.setUrgentImportantCount(UrgentImportant);
        analytics.setNotUrgentImportantCount(NotUrgentImportant);
        analytics.setUrgentNotImportantCount(UrgentNotImportant);
        analytics.setNotUrgentNotImportantCount(NotUrgentNotImportant);
    }

    private void calculateScores(DailyAnalytics analytics) {
        // 1. FOCUS SCORE (0-100)
        int focusMinutes = analytics.getFocusMinutes();
        double focusScore = calculateFocusScore(focusMinutes);
        analytics.setFocusScore(focusScore);

        // 2. TASK COMPLETION SCORE
        double taskScore = analytics.getCompletionRate();

        // 3. OVERALL PRODUCTIVITY SCORE
        double productivity = (taskScore * 0.4) + (focusScore * 0.6);
        analytics.setProductivityScore(productivity);

        // 4. BURNOUT RISK SCORE
        double overworkRisk = (analytics.getOverworkMinutes() / 60.0) * 20; // 20 points per hour
        double lateNightRisk = analytics.getLateNightSessions() * 15; // 15 points per session
        double consecutiveRisk = analytics.getConsecutiveWorkDays() * 5; // 5 points per day

        double burnout = overworkRisk + lateNightRisk + consecutiveRisk;
        burnout = Math.min(100, burnout);

        analytics.setBurnoutRiskScore(burnout);

        log.debug(
                "Scores calculated - Productivity: {}, Focus: {}, Burnout: {}",
                productivity,
                focusScore,
                burnout);
    }

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

    // TODO: implement consecutive work days calculation
    // TODO: add weekly/monthly
}
