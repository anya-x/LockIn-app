package com.lockin.lockin_app.features.users.service;

import com.lockin.lockin_app.features.ai.repository.AIUsageRepository;
import com.lockin.lockin_app.features.analytics.repository.DailyAnalyticsRepository;
import com.lockin.lockin_app.features.badges.repository.BadgeRepository;
import com.lockin.lockin_app.features.categories.repository.CategoryRepository;
import com.lockin.lockin_app.features.focus_sessions.repository.FocusSessionRepository;
import com.lockin.lockin_app.features.goals.repository.GoalRepository;
import com.lockin.lockin_app.features.google.repository.GoogleCalendarTokenRepository;
import com.lockin.lockin_app.features.notifications.repository.NotificationRepository;
import com.lockin.lockin_app.features.tasks.repository.TaskRepository;
import com.lockin.lockin_app.features.users.dto.UserDataExportDTO;
import com.lockin.lockin_app.features.users.dto.UserDataExportDTO.*;
import com.lockin.lockin_app.features.users.entity.User;
import com.lockin.lockin_app.features.users.repository.UserRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.stream.Collectors;

/**
 * Service for GDPR compliance operations including data export and account deletion.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class GDPRService {

    private final UserRepository userRepository;
    private final TaskRepository taskRepository;
    private final GoalRepository goalRepository;
    private final CategoryRepository categoryRepository;
    private final FocusSessionRepository focusSessionRepository;
    private final NotificationRepository notificationRepository;
    private final BadgeRepository badgeRepository;
    private final DailyAnalyticsRepository dailyAnalyticsRepository;
    private final AIUsageRepository aiUsageRepository;
    private final GoogleCalendarTokenRepository googleCalendarTokenRepository;
    private final UserService userService;

    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ISO_LOCAL_DATE;
    private static final DateTimeFormatter DATETIME_FORMATTER = DateTimeFormatter.ISO_LOCAL_DATE_TIME;

    /**
     * Exports all user data for GDPR compliance.
     *
     * @param userId the user ID
     * @return complete user data export
     */
    @Transactional(readOnly = true)
    public UserDataExportDTO exportUserData(Long userId) {
        log.info("Exporting all data for user: {}", userId);

        User user = userService.getUserById(userId);

        return UserDataExportDTO.builder()
                .exportedAt(LocalDateTime.now())
                .profile(buildProfileData(user))
                .tasks(taskRepository.findByUserIdWithCategory(userId).stream()
                        .map(task -> TaskData.builder()
                                .id(task.getId())
                                .title(task.getTitle())
                                .description(task.getDescription())
                                .isUrgent(task.getIsUrgent())
                                .isImportant(task.getIsImportant())
                                .status(task.getStatus().name())
                                .dueDate(task.getDueDate() != null ? task.getDueDate().format(DATETIME_FORMATTER) : null)
                                .categoryName(task.getCategory() != null ? task.getCategory().getName() : null)
                                .createdAt(formatDateTime(task.getCreatedAt()))
                                .updatedAt(formatDateTime(task.getUpdatedAt()))
                                .completedAt(formatDateTime(task.getCompletedAt()))
                                .build())
                        .collect(Collectors.toList()))
                .goals(goalRepository.findByUserIdOrderByCreatedAtDesc(userId).stream()
                        .map(goal -> GoalData.builder()
                                .id(goal.getId())
                                .title(goal.getTitle())
                                .description(goal.getDescription())
                                .type(goal.getType().name())
                                .startDate(formatDate(goal.getStartDate()))
                                .endDate(formatDate(goal.getEndDate()))
                                .targetTasks(goal.getTargetTasks())
                                .targetPomodoros(goal.getTargetPomodoros())
                                .targetFocusMinutes(goal.getTargetFocusMinutes())
                                .currentTasks(goal.getCurrentTasks())
                                .currentPomodoros(goal.getCurrentPomodoros())
                                .currentFocusMinutes(goal.getCurrentFocusMinutes())
                                .completed(goal.getCompleted())
                                .completedDate(formatDate(goal.getCompletedDate()))
                                .createdAt(formatDateTime(goal.getCreatedAt()))
                                .updatedAt(formatDateTime(goal.getUpdatedAt()))
                                .build())
                        .collect(Collectors.toList()))
                .categories(categoryRepository.findByUserIdOrderByCreatedAtDesc(userId).stream()
                        .map(cat -> CategoryData.builder()
                                .id(cat.getId())
                                .name(cat.getName())
                                .color(cat.getColor())
                                .createdAt(formatDateTime(cat.getCreatedAt()))
                                .build())
                        .collect(Collectors.toList()))
                .focusSessions(focusSessionRepository.findByUserIdOrderByStartedAtDescWithRelations(userId).stream()
                        .map(session -> FocusSessionData.builder()
                                .id(session.getId())
                                .sessionType(session.getSessionType().name())
                                .durationMinutes(session.getDurationMinutes())
                                .startedAt(formatDateTime(session.getStartedAt()))
                                .endedAt(formatDateTime(session.getEndedAt()))
                                .completed(session.getCompleted())
                                .notes(session.getNotes())
                                .taskTitle(session.getTask() != null ? session.getTask().getTitle() : null)
                                .build())
                        .collect(Collectors.toList()))
                .notifications(notificationRepository.findByUserIdOrderByCreatedAtDesc(userId).stream()
                        .map(notif -> NotificationData.builder()
                                .id(notif.getId())
                                .type(notif.getType())
                                .title(notif.getTitle())
                                .message(notif.getMessage())
                                .isRead(notif.getIsRead())
                                .createdAt(formatDateTime(notif.getCreatedAt()))
                                .readAt(formatDateTime(notif.getReadAt()))
                                .build())
                        .collect(Collectors.toList()))
                .badges(badgeRepository.findByUserIdOrderByEarnedAtDesc(userId).stream()
                        .map(badge -> BadgeData.builder()
                                .id(badge.getId())
                                .badgeType(badge.getBadgeType().name())
                                .name(badge.getBadgeType().getDisplayName())
                                .description(badge.getBadgeType().getDescription())
                                .earnedAt(formatDateTime(badge.getEarnedAt()))
                                .build())
                        .collect(Collectors.toList()))
                .analytics(dailyAnalyticsRepository.findByUserAndDateBetweenOrderByDateDesc(
                        user,
                        LocalDate.now().minusYears(1),
                        LocalDate.now()
                ).stream()
                        .map(analytics -> AnalyticsData.builder()
                                .date(formatDate(analytics.getDate()))
                                .tasksCreated(analytics.getTasksCreated())
                                .tasksCompleted(analytics.getTasksCompleted())
                                .pomodorosCompleted(analytics.getPomodorosCompleted())
                                .focusMinutes(analytics.getFocusMinutes())
                                .productivityScore(analytics.getProductivityScore())
                                .build())
                        .collect(Collectors.toList()))
                .build();
    }

    /**
     * Deletes all user data and account for GDPR compliance (right to be forgotten).
     *
     * @param userId the user ID
     */
    @Transactional
    public void deleteUserAccount(Long userId) {
        log.warn("Deleting all data for user: {} (GDPR right to be forgotten)", userId);

        User user = userService.getUserById(userId);

        // Delete in order to respect foreign key constraints
        // First, delete data that references tasks
        focusSessionRepository.deleteByUserId(userId);

        // Delete AI usage
        aiUsageRepository.deleteByUser(user);

        // Delete analytics
        dailyAnalyticsRepository.deleteByUser(user);

        // Delete notifications
        notificationRepository.deleteByUserId(userId);

        // Delete badges
        badgeRepository.deleteByUserId(userId);

        // Delete Google Calendar token
        if (googleCalendarTokenRepository.existsByUser(user)) {
            googleCalendarTokenRepository.deleteByUser(user);
        }

        // Delete goals
        goalRepository.deleteByUserId(userId);

        // Delete tasks (must be after focus sessions)
        taskRepository.deleteByUserId(userId);

        // Delete categories
        categoryRepository.deleteByUserId(userId);

        // Finally delete the user
        userRepository.delete(user);

        log.info("Successfully deleted all data for user: {}", userId);
    }

    private UserProfileData buildProfileData(User user) {
        return UserProfileData.builder()
                .id(user.getId())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .email(user.getEmail())
                .currentStreak(user.getCurrentStreak())
                .longestStreak(user.getLongestStreak())
                .lastActivityDate(user.getLastActivityDate() != null
                        ? user.getLastActivityDate().format(DATE_FORMATTER) : null)
                .notifyAiFeatures(user.getNotifyAiFeatures())
                .notifyCalendarSync(user.getNotifyCalendarSync())
                .notifyTaskReminders(user.getNotifyTaskReminders())
                .createdAt(formatDateTime(user.getCreatedAt()))
                .updatedAt(formatDateTime(user.getUpdatedAt()))
                .build();
    }

    private String formatDateTime(LocalDateTime dateTime) {
        return dateTime != null ? dateTime.format(DATETIME_FORMATTER) : null;
    }

    private String formatDate(LocalDate date) {
        return date != null ? date.format(DATE_FORMATTER) : null;
    }
}
