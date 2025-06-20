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
        calculateBurnoutRisk(analytics);

        log.debug(
                "Scores calculated - Productivity: {}, Focus: {}, Burnout: {}",
                analytics.getProductivityScore(),
                analytics.getFocusScore(),
                analytics.getBurnoutRiskScore());
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

    private void calculateBurnoutRisk(DailyAnalytics analytics) {
        double riskScore = 0;

        // overwork indicator (0-40 points)
        // flags if over limit (>60 minutes)
        if (analytics.getOverworkMinutes() > 60) {
            riskScore += Math.min(40, analytics.getOverworkMinutes() / 6.0);
        }

        // late night work (0-30 points)
        // need 2+ sessions to start flagging
        if (analytics.getLateNightSessions() >= 2) {
            riskScore += Math.min(30, (analytics.getLateNightSessions() - 1) * 10);
        }

        // interrupted sessions (0-20 points)
        // flags if > 50% interrupted
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
        // flags if working 7+ days straight
        if (analytics.getConsecutiveWorkDays() >= 7) {
            riskScore += Math.min(10, (analytics.getConsecutiveWorkDays() - 6) * 2);
        }

        analytics.setBurnoutRiskScore(Math.min(100, riskScore));

        log.debug("Burnout risk calculated: {} points", riskScore);
    }

    // TODO: implement consecutive work days calculation
    // TODO: add weekly/monthly aggregation
}
