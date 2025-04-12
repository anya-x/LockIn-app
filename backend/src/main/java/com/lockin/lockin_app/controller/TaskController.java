package com.lockin.lockin_app.controller;

import com.lockin.lockin_app.dto.TaskDTO;
import com.lockin.lockin_app.dto.TaskResponseDTO;
import com.lockin.lockin_app.service.TaskService;

import jakarta.validation.Valid;

import lombok.extern.slf4j.Slf4j;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.validation.BindingResult;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/tasks")
public class TaskController {

    private final TaskService taskService;

    public TaskController(TaskService taskService) {
        this.taskService = taskService;
    }

    @PostMapping
    public ResponseEntity<?> createTask(
            @Valid @RequestBody TaskDTO request,
            BindingResult bindingResult,
            Authentication authentication) {

        String email = authentication.getName();
        log.info("POST /api/tasks : User: {}, Title: {}", email, request.getTitle());

        if (bindingResult.hasErrors()) {
            Map<String, String> errors = new HashMap<>();
            bindingResult
                    .getFieldErrors()
                    .forEach(error -> errors.put(error.getField(), error.getDefaultMessage()));
            log.warn("Task creation validation failed {}: {}", email, errors);
            return ResponseEntity.badRequest().body(errors);
        }

        try {
            TaskResponseDTO response = taskService.createTask(request, email);
            log.info("Task created: ID: {} for user: {}", response.getId(), email);
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (RuntimeException e) {
            log.error("Task creation failed {}: {}", email, e.getMessage());
            Map<String, String> error = new HashMap<>();
            error.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }

    @GetMapping
    public ResponseEntity<?> getUserTasks(Authentication authentication) {
        String email = authentication.getName();
        log.info("GET /api/tasks : User: {}", email);

        try {
            List<TaskResponseDTO> tasks = taskService.getUserTasks(email);
            log.debug("Returning {} tasks for : {}", tasks.size(), email);
            return ResponseEntity.ok(tasks);
        } catch (RuntimeException e) {
            log.error("Failed to fetch tasks for {}: {}", email, e.getMessage());
            Map<String, String> error = new HashMap<>();
            error.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateTask(
            @PathVariable Long id,
            @Valid @RequestBody TaskDTO request,
            BindingResult bindingResult,
            Authentication authentication) {

        String email = authentication.getName();
        log.info("PUT /api/tasks/{} : User: {}", id, email);

        if (bindingResult.hasErrors()) {
            Map<String, String> errors = new HashMap<>();
            bindingResult
                    .getFieldErrors()
                    .forEach(error -> errors.put(error.getField(), error.getDefaultMessage()));
            log.warn("Task update validation failed {} by {}: {}", id, email, errors);
            return ResponseEntity.badRequest().body(errors);
        }

        try {
            TaskResponseDTO response = taskService.updateTask(id, request, email);
            log.info("Task updated  ID: {} by: {}", id, email);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            log.error("Task update failed for  {} by {}: {}", id, email, e.getMessage());
            Map<String, String> error = new HashMap<>();
            error.put("message", e.getMessage());

            if (e.getMessage().contains("Not authorized")) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(error);
            }
            return ResponseEntity.badRequest().body(error);
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteTask(@PathVariable Long id, Authentication authentication) {

        String email = authentication.getName();
        log.info("DELETE /api/tasks/{} : User: {}", id, email);

        try {
            taskService.deleteTask(id, email);
            log.info("Task deleted successfully - ID: {} by user: {}", id, email);
            return ResponseEntity.noContent().build();
        } catch (RuntimeException e) {
            log.error("Task deletion failed for {} by {}: {}", id, email, e.getMessage());
            Map<String, String> error = new HashMap<>();
            error.put("message", e.getMessage());

            if (e.getMessage().contains("Not authorized")) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(error);
            }
            return ResponseEntity.badRequest().body(error);
        }
    }
}
