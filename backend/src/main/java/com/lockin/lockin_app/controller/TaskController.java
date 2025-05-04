package com.lockin.lockin_app.controller;

import com.lockin.lockin_app.dto.EisenhowerMatrixDTO;
import com.lockin.lockin_app.dto.TaskRequestDTO;
import com.lockin.lockin_app.dto.TaskResponseDTO;
import com.lockin.lockin_app.entity.TaskStatus;
import com.lockin.lockin_app.service.TaskService;
import com.lockin.lockin_app.service.UserService;

import jakarta.validation.Valid;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Slf4j
@RestController
@RequestMapping("/api/tasks")
@RequiredArgsConstructor
public class TaskController {

    private final TaskService taskService;
    private final UserService userService;

    @GetMapping
    public ResponseEntity<List<TaskResponseDTO>> getAllTasks(
            @AuthenticationPrincipal UserDetails userDetails) {

        log.debug("GET /api/tasks: User: {}", userDetails.getUsername());

        Long userId = userService.getUserIdFromEmail(userDetails.getUsername());
        List<TaskResponseDTO> tasks = taskService.getUserTasks(userId);

        return ResponseEntity.ok(tasks);
    }

    @GetMapping("/{id}")
    public ResponseEntity<TaskResponseDTO> getTask(
            @PathVariable Long id, @AuthenticationPrincipal UserDetails userDetails) {

        log.debug("GET /api/tasks/{} : User: {}", id, userDetails.getUsername());

        Long userId = userService.getUserIdFromEmail(userDetails.getUsername());
        TaskResponseDTO task = taskService.getTask(id, userId);

        return ResponseEntity.ok(task);
    }

    @PostMapping
    public ResponseEntity<TaskResponseDTO> createTask(
            @Valid @RequestBody TaskRequestDTO request,
            @AuthenticationPrincipal UserDetails userDetails) {

        log.debug("POST /api/tasks : User: {}", userDetails.getUsername());

        Long userId = userService.getUserIdFromEmail(userDetails.getUsername());
        TaskResponseDTO created = taskService.createTask(userId, request);

        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/{id}")
    public ResponseEntity<TaskResponseDTO> updateTask(
            @PathVariable Long id,
            @Valid @RequestBody TaskRequestDTO request,
            @AuthenticationPrincipal UserDetails userDetails) {

        log.debug("PUT /api/tasks/{} : User: {}", id, userDetails.getUsername());

        Long userId = userService.getUserIdFromEmail(userDetails.getUsername());
        TaskResponseDTO updated = taskService.updateTask(id, userId, request);

        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTask(
            @PathVariable Long id, @AuthenticationPrincipal UserDetails userDetails) {

        log.debug("DELETE /api/tasks/{} : User: {}", id, userDetails.getUsername());

        Long userId = userService.getUserIdFromEmail(userDetails.getUsername());
        taskService.deleteTask(id, userId);

        return ResponseEntity.noContent().build();
    }

    @GetMapping("/quadrant")
    public ResponseEntity<List<TaskResponseDTO>> getTasksByQuadrant(
            @RequestParam Boolean isUrgent,
            @RequestParam Boolean isImportant,
            @AuthenticationPrincipal UserDetails userDetails) {

        log.debug("GET /api/tasks/quadrant : User: {}", userDetails.getUsername());

        Long userId = userService.getUserIdFromEmail(userDetails.getUsername());
        List<TaskResponseDTO> tasks = taskService.getTasksByQuadrant(userId, isUrgent, isImportant);
        return ResponseEntity.ok(tasks);
    }

    @GetMapping("/matrix")
    public ResponseEntity<EisenhowerMatrixDTO> getEisenhowerMatrix(
            @AuthenticationPrincipal UserDetails userDetails) {

        log.debug("GET /api/tasks/matrix : User: {}", userDetails.getUsername());

        Long userId = userService.getUserIdFromEmail(userDetails.getUsername());
        EisenhowerMatrixDTO matrix = taskService.getEisenhowerMatrix(userId);
        return ResponseEntity.ok(matrix);
    }

    @PatchMapping("/{id}/quadrant")
    public ResponseEntity<TaskResponseDTO> updateTaskQuadrant(
            @PathVariable Long id,
            @RequestParam Boolean isUrgent,
            @RequestParam Boolean isImportant,
            @AuthenticationPrincipal UserDetails userDetails) {

        log.debug("PATCH /api/tasks/{}/quadrant : User: {}", id, userDetails.getUsername());

        Long userId = userService.getUserIdFromEmail(userDetails.getUsername());
        TaskResponseDTO task = taskService.updateTaskQuadrant(id, userId, isUrgent, isImportant);
        return ResponseEntity.ok(task);
    }

    @GetMapping("/search")
    public ResponseEntity<List<TaskResponseDTO>> searchTasks(
            @RequestParam String query, @AuthenticationPrincipal UserDetails userDetails) {

        log.debug(
                "GET /api/tasks/search : User: {} Search term: {}",
                userDetails.getUsername(),
                query);

        Long userId = userService.getUserIdFromEmail(userDetails.getUsername());
        List<TaskResponseDTO> tasks = taskService.searchTasks(userId, query);
        return ResponseEntity.ok(tasks);
    }

    @GetMapping("/filter")
    public ResponseEntity<List<TaskResponseDTO>> filterTasks(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) Long categoryId,
            @RequestParam(required = false) Boolean isUrgent,
            @RequestParam(required = false) Boolean isImportant,
            @AuthenticationPrincipal UserDetails userDetails) {

        log.debug("GET /api/tasks/filter : User: {}", userDetails.getUsername());
        log.debug("filters status: {}", status);
        log.debug("filters category: {}", categoryId);
        log.debug("filters IsUrgent: {}", isUrgent);
        log.debug("filters IsImportant: {}", isImportant);

        Long userId = userService.getUserIdFromEmail(userDetails.getUsername());

        TaskStatus taskStatus = null;
        if (status != null && !status.equals("all")) {
            taskStatus = TaskStatus.valueOf(status);
        }

        List<TaskResponseDTO> tasks =
                taskService.getTasksWithFilters(
                        userId, taskStatus, categoryId, isUrgent, isImportant);

        return ResponseEntity.ok(tasks);
    }
}
