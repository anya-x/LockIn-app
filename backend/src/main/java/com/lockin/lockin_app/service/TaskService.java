package com.lockin.lockin_app.service;

import com.lockin.lockin_app.dto.EisenhowerMatrixDTO;
import com.lockin.lockin_app.dto.TaskRequestDTO;
import com.lockin.lockin_app.dto.TaskResponseDTO;
import com.lockin.lockin_app.dto.TaskStatisticsDTO;
import com.lockin.lockin_app.entity.Category;
import com.lockin.lockin_app.entity.Task;
import com.lockin.lockin_app.entity.TaskStatus;
import com.lockin.lockin_app.entity.User;
import com.lockin.lockin_app.exception.ResourceNotFoundException;
import com.lockin.lockin_app.exception.UnauthorizedException;
import com.lockin.lockin_app.repository.TaskRepository;

import io.micrometer.core.annotation.Timed;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.slf4j.MDC;

import org.springframework.cache.annotation.CacheEvict;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class TaskService {

    private final TaskRepository taskRepository;
    private final UserService userService;
    private final CategoryService categoryService;
    private final GoalService goalService;
    private final GoogleCalendarService calendarService;
    private final MetricsService metricsService;

    /**
     * Creates a new task for the user
     *
     * <p>validates it belongs to the user
     *
     * @param userId owner of the task
     * @param request task details (title, description, category, priority)
     * @return created task with generated ID
     * @throws ResourceNotFoundException if user or category doesn't exist
     */
    @Transactional
    public TaskResponseDTO createTask(Long userId, TaskRequestDTO request) {
        // Add contextual information to logs using MDC
        // This will be included in JSON logs automatically
        MDC.put("userId", userId.toString());
        MDC.put("operation", "createTask");

        try {
            log.info("Creating task for user: {}", userId);

            User user = userService.getUserById(userId);

            Task task = new Task();
            task.setUser(user);
            updateTaskFromRequest(task, request);

            Task saved = taskRepository.save(task);

            // Record metric: task created
            metricsService.incrementTasksCreated();

            // Automatically sync to Google Calendar if connected and task has due date
            // Database constraint ensures no duplicate event IDs
        // Automatically sync to Google Calendar if connected and task has due date
        // Database constraint ensures no duplicate event IDs
        if (calendarService.isCalendarConnected(user)
            && saved.getDueDate() != null
            && saved.getGoogleEventId() == null) {
            try {
                log.info("Creating calendar event for task: {}", saved.getId());

                // Create event for task due date with 30 min duration (default)
                String eventId = calendarService.createEventFromTask(
                    user,
                    saved.getTitle(),
                    saved.getDescription(),
                    saved.getDueDate(),
                    30  // Default 30 minute duration
                );

                // Store event ID for future sync
                saved.setGoogleEventId(eventId);
                taskRepository.save(saved);

                log.info("Created calendar event {} for task {}", eventId, saved.getId());

            } catch (IllegalArgumentException e) {
                // Validation error - log but don't break task creation
                log.warn("Invalid calendar event data for task {}: {}", saved.getId(), e.getMessage());
            } catch (RuntimeException e) {
                // Calendar sync error (token expired, API error, etc.)
                log.error("Failed to sync task {} to calendar: {}. User may need to reconnect.",
                    saved.getId(), e.getMessage());
            } catch (Exception e) {
                // Unexpected error
                log.error("Unexpected error syncing task {} to calendar", saved.getId(), e);
            }
        }

        return TaskResponseDTO.fromEntity(saved);

            // Add task ID to MDC after creation
            MDC.put("taskId", saved.getId().toString());
            log.info("Created task successfully");

            return TaskResponseDTO.fromEntity(saved);
        } finally {
            // Always clear MDC to avoid memory leaks
            MDC.clear();
        }
