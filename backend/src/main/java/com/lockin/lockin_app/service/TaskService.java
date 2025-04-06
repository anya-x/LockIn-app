package com.lockin.lockin_app.service;

import com.lockin.lockin_app.dto.TaskDTO;
import com.lockin.lockin_app.dto.TaskResponseDTO;
import com.lockin.lockin_app.entity.Task;
import com.lockin.lockin_app.entity.TaskStatus;
import com.lockin.lockin_app.entity.User;
import com.lockin.lockin_app.repository.TaskRepository;
import com.lockin.lockin_app.repository.UserRepository;

import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class TaskService {

    private final TaskRepository taskRepository;
    private final UserRepository userRepository;

    public TaskService(TaskRepository taskRepository, UserRepository userRepository) {
        this.taskRepository = taskRepository;
        this.userRepository = userRepository;
    }

    public TaskResponseDTO createTask(TaskDTO request, String userEmail) {
        User user =
                userRepository
                        .findByEmail(userEmail)
                        .orElseThrow(() -> new RuntimeException("User not found"));

        Task task = new Task();
        task.setTitle(request.getTitle());
        task.setDescription(request.getDescription());
        task.setStatus(request.getStatus() != null ? request.getStatus() : task.getStatus());
        task.setIsUrgent(request.getIsUrgent() != null ? request.getIsUrgent() : false);
        task.setIsImportant(request.getIsImportant() != null ? request.getIsImportant() : false);
        task.setDueDate(request.getDueDate());
        task.setUser(user);

        long activeTasks =
                taskRepository.findByUserId(user.getId()).stream()
                        .filter(t -> t.getStatus() != TaskStatus.COMPLETED)
                        .count();

        if (activeTasks >= 10) {
            System.out.println(
                    "WARNING: User has " + activeTasks + " active tasks. Cognitive overload risk!");
            // TODO: Actually prevent creation or just warning?
        }

        Task saved = taskRepository.save(task);
        return mapToResponse(saved);
    }

    public List<TaskResponseDTO> getUserTasks(String userEmail) {
        User user =
                userRepository
                        .findByEmail(userEmail)
                        .orElseThrow(() -> new RuntimeException("User not found"));

        return taskRepository
                .findByUserId(user.getId()) // N+1 query here!
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public TaskResponseDTO updateTask(Long taskId, TaskDTO request, String userEmail) {
        User user =
                userRepository
                        .findByEmail(userEmail)
                        .orElseThrow(() -> new RuntimeException("User not found"));

        Task task =
                taskRepository
                        .findById(taskId)
                        .orElseThrow(() -> new RuntimeException("Task not found"));

        // Check ownership
        if (!task.getUser().getId().equals(user.getId())) {
            throw new RuntimeException("Not authorized"); // Should be 403
        }

        task.setTitle(request.getTitle());
        task.setDescription(request.getDescription());
        if (request.getStatus() != null) task.setStatus(request.getStatus());
        if (request.getIsUrgent() != null) task.setIsUrgent(request.getIsUrgent());
        if (request.getIsImportant() != null) task.setIsImportant(request.getIsImportant());
        task.setDueDate(request.getDueDate());

        Task updated = taskRepository.save(task);
        return mapToResponse(updated);
    }

    public void deleteTask(Long taskId, String userEmail) {
        User user =
                userRepository
                        .findByEmail(userEmail)
                        .orElseThrow(() -> new RuntimeException("User not found"));

        Task task =
                taskRepository
                        .findById(taskId)
                        .orElseThrow(() -> new RuntimeException("Task not found"));

        if (!task.getUser().getId().equals(user.getId())) {
            throw new RuntimeException("Not authorized");
        }

        taskRepository.delete(task);
    }

    private TaskResponseDTO mapToResponse(Task task) {
        TaskResponseDTO response = new TaskResponseDTO();
        response.setId(task.getId());
        response.setTitle(task.getTitle());
        response.setDescription(task.getDescription());
        response.setStatus(task.getStatus());
        response.setIsUrgent(task.getIsUrgent());
        response.setIsImportant(task.getIsImportant());
        response.setDueDate(task.getDueDate());
        response.setCreatedAt(task.getCreatedAt());
        response.setUpdatedAt(task.getUpdatedAt());
        return response;
    }
}
