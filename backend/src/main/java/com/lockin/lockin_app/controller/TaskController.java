package com.lockin.lockin_app.controller;

import com.lockin.lockin_app.dto.TaskDTO;
import com.lockin.lockin_app.dto.TaskResponseDTO;
import com.lockin.lockin_app.service.TaskService;

import jakarta.validation.Valid;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/tasks")
public class TaskController {

    private final TaskService taskService;

    public TaskController(TaskService taskService) {
        this.taskService = taskService;
    }

    @PostMapping
    public ResponseEntity<?> createTask(
            @Valid @RequestBody TaskDTO request, Authentication authentication) {
        try {
            String email = authentication.getName();
            TaskResponseDTO response = taskService.createTask(request, email);
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping
    public ResponseEntity<?> getUserTasks(Authentication authentication) {
        try {
            String email = authentication.getName();
            List<TaskResponseDTO> tasks = taskService.getUserTasks(email);
            return ResponseEntity.ok(tasks);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateTask(
            @PathVariable Long id,
            @Valid @RequestBody TaskDTO request,
            Authentication authentication) {
        try {
            String email = authentication.getName();
            TaskResponseDTO response = taskService.updateTask(id, request, email);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteTask(@PathVariable Long id, Authentication authentication) {
        try {
            String email = authentication.getName();
            taskService.deleteTask(id, email);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}
