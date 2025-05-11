package com.lockin.lockin_app.service;

import com.lockin.lockin_app.dto.EisenhowerMatrixDTO;
import com.lockin.lockin_app.dto.TaskRequestDTO;
import com.lockin.lockin_app.dto.TaskResponseDTO;
import com.lockin.lockin_app.dto.TaskStatisticsDTO;
import com.lockin.lockin_app.entity.Category;
import com.lockin.lockin_app.entity.Task;
import com.lockin.lockin_app.entity.TaskStatus;
import com.lockin.lockin_app.entity.User;
import com.lockin.lockin_app.repository.TaskRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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

        List<Task> tasks = taskRepository.findByUserIdOrderByCreatedAtDesc(userId);

        return tasks.stream().map(TaskResponseDTO::fromEntity).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public TaskResponseDTO getTask(Long taskId, Long userId) {
        log.debug("Fetching task: {} for user: {}", taskId, userId);

        Task task =
                taskRepository
                        .findById(taskId)
                        .orElseThrow(() -> new RuntimeException("Task not found"));

        if (!task.getUser().getId().equals(userId)) {
            throw new RuntimeException("Unauthorised");
        }

        return TaskResponseDTO.fromEntity(task);
    }

    @Transactional
    public TaskResponseDTO updateTask(Long taskId, Long userId, TaskRequestDTO request) {
        log.info("Updating task: {} for user: {}", taskId, userId);

        Task task =
                taskRepository
                        .findById(taskId)
                        .orElseThrow(() -> new RuntimeException("Task not found"));

        if (!task.getUser().getId().equals(userId)) {
            throw new RuntimeException("Unauthorised");
        }

        TaskStatus oldStatus = task.getStatus();
        TaskStatus newStatus = request.getStatus();

        if (oldStatus != TaskStatus.COMPLETED && newStatus == TaskStatus.COMPLETED) {
            task.setCompletedAt(LocalDateTime.now());
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
                        .orElseThrow(() -> new RuntimeException("Task not found"));

        if (!task.getUser().getId().equals(userId)) {
            throw new RuntimeException("Unauthorised: You don't own this task");
        }

        taskRepository.delete(task);

        log.info("Deleted task: {}", taskId);
    }

    @Transactional(readOnly = true)
    public List<TaskResponseDTO> getTasksByQuadrant(
            Long userId, Boolean isUrgent, Boolean isImportant) {
        log.debug("Fetching tasks for user by quadrant: {}", userId);

        List<Task> tasks = taskRepository.findByQuadrant(userId, isUrgent, isImportant);

        return tasks.stream().map(TaskResponseDTO::fromEntity).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public EisenhowerMatrixDTO getEisenhowerMatrix(Long userId) {

        log.debug("Fetching Einshenhower matrix for user: {}", userId);

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
                        .orElseThrow(() -> new RuntimeException("Task not found"));

        if (!task.getUser().getId().equals(userId)) {
            throw new RuntimeException("Unauthorised");
        }

        task.setIsUrgent(isUrgent);
        task.setIsImportant(isImportant);

        Task updated = taskRepository.save(task);

        log.info("Updated task quadrant: {}", updated.getId());

        return TaskResponseDTO.fromEntity(updated);
    }

    @Transactional(readOnly = true)
    public List<TaskResponseDTO> searchTasks(Long userId, String searchTerm) {

        log.debug("Fetching tasks for user {} by searchTerm: {}", userId, searchTerm);

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

        log.debug(
                "=========================== Fetching tasks for user : {} ===========================",
                userId);
        log.debug("filters status: {}", status);
        log.debug("filters category: {}", categoryId);
        log.debug("filters IsUrgent: {}", isUrgent);
        log.debug("filters IsImportant: {}", isImportant);

        List<Task> tasks =
                taskRepository.findByFilters(userId, status, categoryId, isUrgent, isImportant);

        return tasks.stream().map(TaskResponseDTO::fromEntity).collect(Collectors.toList());
    }

    public TaskStatisticsDTO getStatistics(Long userId) {
        TaskStatisticsDTO stats = new TaskStatisticsDTO();

        List<Task> allTasks = taskRepository.findByUserIdOrderByCreatedAtDesc(userId);

        // Basic counts
        stats.setTotalTasks((long) allTasks.size());
        stats.setTodoCount(allTasks.stream().filter(t -> t.getStatus() == TaskStatus.TODO).count());
        stats.setInProgressCount(
                allTasks.stream().filter(t -> t.getStatus() == TaskStatus.IN_PROGRESS).count());
        stats.setCompletedCount(
                allTasks.stream().filter(t -> t.getStatus() == TaskStatus.COMPLETED).count());

        // Urgent/Important counts
        stats.setUrgentCount(allTasks.stream().filter(Task::getIsUrgent).count());
        stats.setImportantCount(allTasks.stream().filter(Task::getIsImportant).count());
        stats.setUrgentAndImportantCount(
                allTasks.stream().filter(t -> t.getIsUrgent() && t.getIsImportant()).count());

        // Completion rate
        if (stats.getTotalTasks() > 0) {
            double rate = (stats.getCompletedCount().doubleValue() / stats.getTotalTasks()) * 100;
            stats.setCompletionRate(Math.round(rate * 10.0) / 10.0); // Round to 1 decimal
        } else {
            stats.setCompletionRate(0.0);
        }

        // Tasks by category
        Map<String, Long> byCategory =
                allTasks.stream()
                        .filter(t -> t.getCategory() != null)
                        .collect(
                                Collectors.groupingBy(
                                        t -> t.getCategory().getName(), Collectors.counting()));
        stats.setTasksByCategory(byCategory);

        // This week's stats
        LocalDateTime oneWeekAgo = LocalDateTime.now().minusWeeks(1);

        stats.setTasksCreatedThisWeek(
                allTasks.stream().filter(t -> t.getCreatedAt().isAfter(oneWeekAgo)).count());

        // TO DO: add created field entity
        //        stats.setTasksCompletedThisWeek(
        //                allTasks.stream()
        //                        .filter(
        //                                t ->
        //                                        t.getCompletedAt() != null
        //                                                && t.getCompletedAt().isAfter(oneWeekAgo))
        //                        .count());
        stats.setTasksCompletedThisWeek(0L);

        return stats;
    }

    public Page<TaskResponseDTO> getTasksPaginated(Long userId, Pageable pageable) {
        Page<Task> tasksPaginated = taskRepository.findByUserId(userId, pageable);
        return tasksPaginated.map(TaskResponseDTO::fromEntity);
    }
}
