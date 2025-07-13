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

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashMap;
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
        log.info("Creating task for user: {}", userId);

        User user = userService.getUserById(userId);

        Task task = new Task();
        task.setUser(user);
        updateTaskFromRequest(task, request);

        Task saved = taskRepository.save(task);

        log.info("Created task: {}", saved.getId());

        return TaskResponseDTO.fromEntity(saved);
    }

    // updates task fields from request DTO
    // handles category linking and default status
    private void updateTaskFromRequest(Task task, TaskRequestDTO request) {
        task.setTitle(request.getTitle());
        task.setDescription(request.getDescription());

        task.setIsUrgent(request.getIsUrgent() != null ? request.getIsUrgent() : false);
        task.setIsImportant(request.getIsImportant() != null ? request.getIsImportant() : false);

        task.setDueDate(request.getDueDate());

        if (request.getStatus() != null) {
            task.setStatus(request.getStatus());
        } else {
            task.setStatus(TaskStatus.TODO);
        }

        if (request.getCategoryId() != null) {
            Category category =
                    categoryService.getCategoryForUser(
                            request.getCategoryId(), task.getUser().getId());
            task.setCategory(category);
        } else {
            task.setCategory(null);
        }
    }

    @Transactional(readOnly = true)
    public List<TaskResponseDTO> getUserTasks(Long userId) {
        log.debug("Fetching tasks for user: {}", userId);

        List<Task> tasks = taskRepository.findByUserIdOrderByCreatedAtDescWithCategory(userId);

        return tasks.stream().map(TaskResponseDTO::fromEntity).collect(Collectors.toList());
    }

    /**
     * Gets a specific task
     *
     * <p>Validates user owns the task before returning.
     *
     * @throws ResourceNotFoundException if task doesn't exist
     * @throws UnauthorizedException if user doesn't own task
     */
    @Transactional(readOnly = true)
    public TaskResponseDTO getTask(Long taskId, Long userId) {
        log.debug("Fetching task: {} for user: {}", taskId, userId);

        Task task =
                taskRepository
                        .findById(taskId)
                        .orElseThrow(() -> new ResourceNotFoundException("Task", "id", taskId));

        validateTaskOwnership(task, userId);

        return TaskResponseDTO.fromEntity(task);
    }

    /**
     * Updates an existing task
     *
     * <p>Automatically sets completedAt timestamp when status changes to COMPLETED. Clears
     * completedAt if status changes away from COMPLETED.
     *
     * @throws ResourceNotFoundException if task doesn't exist
     * @throws UnauthorizedException if user doesn't own task
     */
    @Transactional
    public TaskResponseDTO updateTask(Long taskId, Long userId, TaskRequestDTO request) {
        log.info("Updating task: {} for user: {}", taskId, userId);

        Task task =
                taskRepository
                        .findById(taskId)
                        .orElseThrow(() -> new ResourceNotFoundException("Task", "id", taskId));

        validateTaskOwnership(task, userId);

        TaskStatus oldStatus = task.getStatus();
        TaskStatus newStatus = request.getStatus();

        if (oldStatus != TaskStatus.COMPLETED && newStatus == TaskStatus.COMPLETED) {
            LocalDateTime completionTime = LocalDateTime.now();
            task.setCompletedAt(completionTime);

            log.debug("Task {} marked as completed, updating goals", taskId);
            goalService.updateGoalsFromTaskCompletion(userId, completionTime);
        } else if (oldStatus == TaskStatus.COMPLETED && newStatus != TaskStatus.COMPLETED) {
            task.setCompletedAt(null);
        }

        updateTaskFromRequest(task, request);
        Task updated = taskRepository.save(task);

        log.info("Updated task: {}", updated.getId());

        return TaskResponseDTO.fromEntity(updated);
    }

    @Transactional
    public void deleteTask(Long taskId, Long userId) {
        log.info("Deleting task: {} for user: {}", taskId, userId);

        Task task =
                taskRepository
                        .findById(taskId)
                        .orElseThrow(() -> new ResourceNotFoundException("Task", "id", taskId));

        validateTaskOwnership(task, userId);

        taskRepository.delete(task);

        log.info("Deleted task: {}", taskId);
    }

    /**
     * Gets tasks by Eisenhower matrix quadrant
     *
     * @param isImportant boolean
     * @param isUrgent boolean
     */
    @Transactional(readOnly = true)
    public List<TaskResponseDTO> getTasksByQuadrant(
            Long userId, Boolean isUrgent, Boolean isImportant) {

        log.debug("Fetching tasks for user by quadrant: {}", userId);

        List<Task> tasks = taskRepository.findByQuadrant(userId, isUrgent, isImportant);

        return tasks.stream().map(TaskResponseDTO::fromEntity).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public EisenhowerMatrixDTO getEisenhowerMatrix(Long userId) {

        log.debug("Fetching Eisenhower matrix for user: {}", userId);

        EisenhowerMatrixDTO matrix = new EisenhowerMatrixDTO();

        matrix.setDoFirst(
                taskRepository.findByQuadrant(userId, true, true).stream()
                        .map(TaskResponseDTO::fromEntity)
                        .collect(Collectors.toList()));

        matrix.setSchedule(
                taskRepository.findByQuadrant(userId, false, true).stream()
                        .map(TaskResponseDTO::fromEntity)
                        .collect(Collectors.toList()));

        matrix.setDelegate(
                taskRepository.findByQuadrant(userId, true, false).stream()
                        .map(TaskResponseDTO::fromEntity)
                        .collect(Collectors.toList()));

        matrix.setEliminate(
                taskRepository.findByQuadrant(userId, false, false).stream()
                        .map(TaskResponseDTO::fromEntity)
                        .collect(Collectors.toList()));
        return matrix;
    }

    public TaskResponseDTO updateTaskQuadrant(
            Long taskId, Long userId, Boolean isUrgent, Boolean isImportant) {

        log.info("Updating task quadrant: {} for user: {}", taskId, userId);

        Task task =
                taskRepository
                        .findById(taskId)
                        .orElseThrow(() -> new ResourceNotFoundException("Task", "id", taskId));

        validateTaskOwnership(task, userId);

        task.setIsUrgent(isUrgent);
        task.setIsImportant(isImportant);

        Task updated = taskRepository.save(task);

        log.info("Updated task quadrant: {}", updated.getId());

        return TaskResponseDTO.fromEntity(updated);
    }

    @Transactional(readOnly = true)
    public List<TaskResponseDTO> searchTasks(Long userId, String searchTerm) {

        log.debug("Searching tasks for user {} with term: {}", userId, searchTerm);

        List<Task> tasks = taskRepository.searchTasks(userId, searchTerm);
        return tasks.stream().map(TaskResponseDTO::fromEntity).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<TaskResponseDTO> getTasksWithFilters(
            Long userId,
            TaskStatus status,
            Long categoryId,
            Boolean isUrgent,
            Boolean isImportant) {

        log.debug("Fetching filtered tasks for user: {}", userId);

        List<Task> tasks =
                taskRepository.findByFilters(userId, status, categoryId, isUrgent, isImportant);

        return tasks.stream().map(TaskResponseDTO::fromEntity).collect(Collectors.toList());
    }

    /**
     * Calculates task statistics
     *
     * @return statistics: counted by status, completion rate, category distribution and this week's
     *     activity
     */
    public TaskStatisticsDTO getStatistics(Long userId) {
        TaskStatisticsDTO stats = new TaskStatisticsDTO();

        // Use database COUNT queries instead of fetching all tasks
        stats.setTotalTasks(taskRepository.countByUserId(userId));
        stats.setTodoCount(taskRepository.countByUserIdAndStatus(userId, TaskStatus.TODO));
        stats.setInProgressCount(
                taskRepository.countByUserIdAndStatus(userId, TaskStatus.IN_PROGRESS));
        stats.setCompletedCount(
                taskRepository.countByUserIdAndStatus(userId, TaskStatus.COMPLETED));

        // Urgent/Important counts
        stats.setUrgentCount(taskRepository.countByUserIdAndIsUrgent(userId, true));
        stats.setImportantCount(taskRepository.countByUserIdAndIsImportant(userId, true));
        stats.setUrgentAndImportantCount(
                taskRepository.countByUserIdAndIsUrgentAndIsImportant(userId, true, true));

        // Completion rate
        if (stats.getTotalTasks() > 0) {
            double rate = (stats.getCompletedCount().doubleValue() / stats.getTotalTasks()) * 100;
            stats.setCompletionRate(Math.round(rate * 10.0) / 10.0);
        } else {
            stats.setCompletionRate(0.0);
        }

        Map<String, Long> byCategory = new HashMap<>();
        List<Object[]> categoryCounts = taskRepository.countTasksByCategory(userId);
        for (Object[] row : categoryCounts) {
            byCategory.put((String) row[0], (Long) row[1]);
        }
        stats.setTasksByCategory(byCategory);

        // This week's stats
        LocalDateTime oneWeekAgo = LocalDateTime.now().minusWeeks(1);

        stats.setTasksCreatedThisWeek(
                taskRepository.countByUserIdAndCreatedAtAfter(userId, oneWeekAgo));

        stats.setTasksCompletedThisWeek(
                taskRepository.countByUserIdAndCompletedAtAfter(userId, oneWeekAgo));

        return stats;
    }

    public Page<TaskResponseDTO> getTasksPaginated(Long userId, Pageable pageable) {
        Page<Task> tasksPaginated = taskRepository.findByUserId(userId, pageable);
        return tasksPaginated.map(TaskResponseDTO::fromEntity);
    }

    public Page<TaskResponseDTO> getTasksWithFiltersPaginated(
            Long userId,
            TaskStatus status,
            Long categoryId,
            Boolean isUrgent,
            Boolean isImportant,
            Pageable pageable) {

        Page<Task> taskPage =
                taskRepository.findByFiltersPaginated(
                        userId, status, categoryId, isUrgent, isImportant, pageable);

        return taskPage.map(TaskResponseDTO::fromEntity);
    }

    @Transactional(readOnly = true)
    public List<TaskResponseDTO> getIncompleteTasks(Long userId) {
        log.debug("Fetching all incomplete tasks for user: {}", userId);

        List<Task> tasks =
                taskRepository.findByUserIdAndStatusNotOrderByCreatedAtDescWithCategory(
                        userId, TaskStatus.COMPLETED);

        log.info("Found {} incomplete tasks for user {}", tasks.size(), userId);

        return tasks.stream().map(TaskResponseDTO::fromEntity).collect(Collectors.toList());
    }

    /**
     * Validates task ownership and throws exception if user doesn't own it
     *
     * @throws UnauthorizedException if task doesn't belong to user
     */
    private void validateTaskOwnership(Task task, Long userId) {
        if (!task.getUser().getId().equals(userId)) {
            log.warn(
                    "User {} attempted to access task {} owned by user {}",
                    userId,
                    task.getId(),
                    task.getUser().getId());
            throw new UnauthorizedException("You do not have permission to access this task");
        }
    }
}
