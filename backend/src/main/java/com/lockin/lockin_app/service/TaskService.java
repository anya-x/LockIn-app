package com.lockin.lockin_app.service;

import com.lockin.lockin_app.dto.EisenhowerMatrixDTO;
import com.lockin.lockin_app.dto.TaskRequestDTO;
import com.lockin.lockin_app.dto.TaskResponseDTO;
import com.lockin.lockin_app.entity.Category;
import com.lockin.lockin_app.entity.Task;
import com.lockin.lockin_app.entity.TaskStatus;
import com.lockin.lockin_app.entity.User;
import com.lockin.lockin_app.repository.TaskRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
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

        matrix.setDoFirst(taskRepository.findByQuadrant(userId, true, true));

        matrix.setSchedule(taskRepository.findByQuadrant(userId, false, true));

        matrix.setDelegate(taskRepository.findByQuadrant(userId, true, false));

        matrix.setEliminate(taskRepository.findByQuadrant(userId, false, false));

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
}
