package com.lockin.lockin_app.scheduler;

import com.lockin.lockin_app.features.notifications.entity.NotificationType;
import com.lockin.lockin_app.features.notifications.service.NotificationService;
import com.lockin.lockin_app.features.tasks.entity.Task;
import com.lockin.lockin_app.features.tasks.repository.TaskRepository;
import com.lockin.lockin_app.features.users.entity.User;
import com.lockin.lockin_app.features.users.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

/**
 * Scheduled job for sending task due date reminders.
 *
 * Runs daily at 9 AM to notify users about:
 * - Tasks due today
 * - Overdue tasks
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class TaskReminderScheduler {

    private final TaskRepository taskRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("MMM d");

    /**
     * Send daily reminders at 9 AM.
     */
    @Scheduled(cron = "0 0 9 * * *")
    public void sendDailyReminders() {
        log.info("Starting daily task reminder job");

        LocalDateTime now = LocalDateTime.now();
        LocalDateTime endOfToday = LocalDate.now().atTime(LocalTime.MAX);

        // Find all users with tasks due today or overdue
        List<Long> userIds = taskRepository.findUserIdsWithUpcomingDueDates(endOfToday);

        log.info("Found {} users with upcoming due dates", userIds.size());

        int totalNotifications = 0;

        for (Long userId : userIds) {
            try {
                // Check if user has task reminders enabled
                if (!notificationService.hasTaskRemindersEnabled(userId)) {
                    log.debug("Skipping reminders for user {} - disabled in preferences", userId);
                    continue;
                }

                User user = userRepository.findById(userId).orElse(null);
                if (user == null) {
                    continue;
                }

                int sent = sendRemindersForUser(user, now);
                totalNotifications += sent;

            } catch (Exception e) {
                log.error("Failed to send reminders for user {}: {}", userId, e.getMessage());
            }
        }

        log.info("Task reminder job complete: {} notifications sent", totalNotifications);
    }

    /**
     * Send reminders for a specific user.
     */
    private int sendRemindersForUser(User user, LocalDateTime now) {
        int sent = 0;

        // Get tasks due today
        LocalDateTime startOfDay = LocalDate.now().atStartOfDay();
        LocalDateTime endOfDay = LocalDate.now().atTime(LocalTime.MAX);

        List<Task> tasksDueToday = taskRepository.findTasksDueToday(
                user.getId(), startOfDay, endOfDay);

        // Get overdue tasks
        List<Task> overdueTasks = taskRepository.findOverdueTasks(user.getId(), startOfDay);

        // Send notification for tasks due today
        if (!tasksDueToday.isEmpty()) {
            String message = tasksDueToday.size() == 1
                    ? String.format("'%s' is due today", truncate(tasksDueToday.get(0).getTitle(), 30))
                    : String.format("%d tasks are due today", tasksDueToday.size());

            notificationService.createNotification(
                    user,
                    NotificationType.TASK_DUE,
                    "Tasks Due Today",
                    message,
                    "/tasks"
            );
            sent++;
            log.debug("Sent due today reminder to user {}: {} tasks", user.getId(), tasksDueToday.size());
        }

        // Send notification for overdue tasks
        if (!overdueTasks.isEmpty()) {
            String message = overdueTasks.size() == 1
                    ? String.format("'%s' is overdue", truncate(overdueTasks.get(0).getTitle(), 30))
                    : String.format("%d tasks are overdue", overdueTasks.size());

            notificationService.createNotification(
                    user,
                    NotificationType.TASK_OVERDUE,
                    "Overdue Tasks",
                    message,
                    "/tasks"
            );
            sent++;
            log.debug("Sent overdue reminder to user {}: {} tasks", user.getId(), overdueTasks.size());
        }

        return sent;
    }

    /**
     * Truncate string to max length with ellipsis.
     */
    private String truncate(String str, int maxLength) {
        if (str == null || str.length() <= maxLength) {
            return str;
        }
        return str.substring(0, maxLength - 3) + "...";
    }
}
