package com.lockin.lockin_app.features.analytics.service;

import com.lockin.lockin_app.features.analytics.dto.DailyAnalyticsDTO;
import com.lockin.lockin_app.exception.ResourceNotFoundException;
import com.lockin.lockin_app.features.analytics.entity.DailyAnalytics;
import com.lockin.lockin_app.features.focus_sessions.entity.FocusSession;
import com.lockin.lockin_app.features.tasks.entity.Task;
import com.lockin.lockin_app.features.tasks.entity.TaskStatus;
import com.lockin.lockin_app.features.users.entity.User;
import com.lockin.lockin_app.features.analytics.repository.DailyAnalyticsRepository;
import com.lockin.lockin_app.features.focus_sessions.repository.FocusSessionRepository;
import com.lockin.lockin_app.features.tasks.repository.TaskRepository;
import com.lockin.lockin_app.features.users.repository.UserRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import org.springframework.cache.annotation.CacheEvict;
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
    @Cacheable(value = "dailyAnalytics", key = "#userId + '_' + #date")
    @Transactional
    public DailyAnalyticsDTO calculateDailyAnalytics(Long userId, LocalDate date) {
        User user =
                userRepository
                        .findById(userId)
                        .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

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
        calculateConsecutiveWorkDays(analytics, user, date);
        calculatePomodoroMetrics(analytics, user, date);
        calculateEisenhowerDistribution(analytics, user, date);
        calculateScores(analytics);

        DailyAnalytics saved = dailyAnalyticsRepository.save(analytics);

        return DailyAnalyticsDTO.fromEntity(saved);
    }

    // counts tasks created and completed on the given date
    private void calculateTaskMetrics(DailyAnalytics analytics, User user, LocalDate date) {
        LocalDateTime startOfDay = date.atStartOfDay();
        LocalDateTime endOfDay = date.plusDays(1).atStartOfDay();

        List<Task> tasksCreatedToday =
                taskRepository.findByUserIdAndCreatedAtBetween(user.getId(), startOfDay, endOfDay);

        List<Task> tasksCompletedToday =
                taskRepository.findByUserIdAndStatusAndUpdatedAtBetween(
                        user.getId(), TaskStatus.COMPLETED, startOfDay, endOfDay);

        int created = tasksCreatedToday.size();
        int completedTotal = tasksCompletedToday.size();

        // Count tasks that were both created AND completed today
        int completedFromToday =
                (int)
                        tasksCreatedToday.stream()
                                .filter(
                                        t ->
                                                t.getStatus() == TaskStatus.COMPLETED
                                                        && t.getUpdatedAt() != null
                                                        && t.getUpdatedAt().isAfter(startOfDay)
                                                        && t.getUpdatedAt().isBefore(endOfDay))
                                .count();

        analytics.setTasksCreated(created);
        analytics.setTasksCompleted(completedTotal);
        analytics.setTasksCompletedFromToday(completedFromToday);
        analytics.setTasksDeleted(0);

        double completionRate = created > 0 ? (completedFromToday / (double) created) * 100 : 0.0;
        analytics.setCompletionRate(Math.round(completionRate * 100.0) / 100.0);
    }

    /**
     * Calculates Pomodoro session metrics
     *
     * <p>Includes focus minutes, break minutes, interrupted sessions and late night work detection
     * (sessions after 10 PM).
     */
    private void calculatePomodoroMetrics(DailyAnalytics analytics, User user, LocalDate date) {
        LocalDateTime startOfDay = date.atStartOfDay();
        LocalDateTime endOfDay = date.atTime(23, 59, 59);

        List<FocusSession> sessions =
                focusSessionRepository.findByUserAndStartedAtBetweenWithRelations(
                        user, startOfDay, endOfDay);

        int completed = 0;
        int totalFocusMinutes = 0;
        int totalBreakMinutes = 0;
        int interrupted = 0;
        int lateNight = 0;

        int morningFocus = 0;
        int afternoonFocus = 0;
        int eveningFocus = 0;
        int nightFocus = 0;

        for (FocusSession session : sessions) {
            if (session.getCompleted()) {
                completed++;
                int workDuration = session.getWorkDuration();
                totalFocusMinutes += workDuration;

                int hour = session.getStartedAt().getHour();
                if (hour >= 6 && hour < 12) {
                    morningFocus += workDuration;
                } else if (hour >= 12 && hour < 18) {
                    afternoonFocus += workDuration;
                } else if (hour >= 18 && hour < 24) {
                    eveningFocus += workDuration;
                } else {
                    nightFocus += workDuration;
                }

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

        analytics.setMorningFocusMinutes(morningFocus);
        analytics.setAfternoonFocusMinutes(afternoonFocus);
        analytics.setEveningFocusMinutes(eveningFocus);
        analytics.setNightFocusMinutes(nightFocus);

        int overwork = Math.max(0, totalFocusMinutes - MAX_HEALTHY_MINUTES);
        analytics.setOverworkMinutes(overwork);
    }

    // counts current tasks by Eisenhower matrix quadrant
    private void calculateEisenhowerDistribution(
            DailyAnalytics analytics, User user, LocalDate date) {
        List<Task> incompleteTasks =
                taskRepository.findByUserIdAndStatusNotWithCategory(
                        user.getId(), TaskStatus.COMPLETED);

        int urgentImportant = 0;
        int notUrgentImportant = 0;
        int urgentNotImportant = 0;
        int notUrgentNotImportant = 0;

        for (Task task : incompleteTasks) {
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

    /**
     * Calculates daily averages for a date range. Returns the average values per day across all
     * metrics.
     *
     * @param userId user to calculate analytics for
     * @param startDate start of period
     * @param endDate end of period
     * @return daily average analytics for the period
     */
    @Cacheable(value = "periodAnalytics", key = "#userId + '_' + #startDate + '_' + #endDate")
    public DailyAnalyticsDTO getAverageForPeriod(
            Long userId, LocalDate startDate, LocalDate endDate) {
        User user =
                userRepository
                        .findById(userId)
                        .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        DailyAnalytics average = new DailyAnalytics();
        average.setUser(user);
        average.setDate(endDate);

        int totalTasksCreated = 0;
        int totalTasksCompleted = 0;
        int totalTasksCompletedFromToday = 0;
        int totalPomodoros = 0;
        int totalFocusMinutes = 0;
        int totalBreakMinutes = 0;
        double totalProductivity = 0;
        double totalBurnout = 0;
        int dayCount = 0;

        for (LocalDate date = startDate; !date.isAfter(endDate); date = date.plusDays(1)) {
            DailyAnalyticsDTO dayAnalytics = calculateDailyAnalytics(userId, date);
            totalTasksCreated += dayAnalytics.getTasksCreated();
            totalTasksCompleted += dayAnalytics.getTasksCompleted();
            totalTasksCompletedFromToday += dayAnalytics.getTasksCompletedFromToday();
            totalPomodoros += dayAnalytics.getPomodorosCompleted();
            totalFocusMinutes += dayAnalytics.getFocusMinutes();
            totalBreakMinutes += dayAnalytics.getBreakMinutes();
            totalProductivity += dayAnalytics.getProductivityScore();
            totalBurnout += dayAnalytics.getBurnoutRiskScore();
            dayCount++;
        }

        if (dayCount > 0) {
            // Return daily averages for all metrics
            average.setTasksCreated(totalTasksCreated / dayCount);
            average.setTasksCompleted(totalTasksCompleted / dayCount);
            average.setTasksCompletedFromToday(totalTasksCompletedFromToday / dayCount);
            average.setPomodorosCompleted(totalPomodoros / dayCount);
            average.setFocusMinutes(totalFocusMinutes / dayCount);
            average.setBreakMinutes(totalBreakMinutes / dayCount);
            average.setProductivityScore(totalProductivity / dayCount);
            average.setBurnoutRiskScore(totalBurnout / dayCount);
            average.setCompletionRate(
                    totalTasksCreated > 0
                            ? (totalTasksCompletedFromToday / (double) totalTasksCreated) * 100
                            : 0.0);
        }

        return DailyAnalyticsDTO.fromEntity(average);
    }

    /**
     * Invalidates analytics cache for a specific date
     *
     * <p>called when new tasks or focus sessions are added
     *
     * @param userId user
     * @param date date
     */
    @CacheEvict(
            value = {"dailyAnalytics", "periodAnalytics"},
            allEntries = true)
    public void invalidateCache(Long userId, LocalDate date) {
        log.debug("Invalidating analytics cache for user {} on {}", userId, date);
    }

    /**
     * Calculates consecutive work days by looking backwards at previous days
     *
     * <p>A "work day" is defined as: >30 minutes focus time OR >1 task completed
     */
    private void calculateConsecutiveWorkDays(DailyAnalytics analytics, User user, LocalDate date) {
        boolean isProductiveDay =
                analytics.getFocusMinutes() >= 30 || analytics.getTasksCompleted() >= 1;

        if (!isProductiveDay) {
            analytics.setConsecutiveWorkDays(0);
            return;
        }

        int consecutiveDays = 1;
        LocalDate checkDate = date.minusDays(1);

        for (int i = 0; i < 30; i++) {
            DailyAnalytics previousDay =
                    dailyAnalyticsRepository.findByUserAndDate(user, checkDate).orElse(null);
            if (previousDay == null) {
                break;
            }
            boolean wasPreviousDayProductive =
                    previousDay.getFocusMinutes() >= 30 || previousDay.getTasksCompleted() >= 1;
            if (wasPreviousDayProductive) {
                consecutiveDays++;
                checkDate = checkDate.minusDays(1);
            } else {
                break;
            }
        }

        analytics.setConsecutiveWorkDays(consecutiveDays);

        log.debug("Consecutive work days for {}: {}", date, consecutiveDays);
    }
}
