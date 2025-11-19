package com.lockin.lockin_app.features.tasks.controller;

import com.lockin.lockin_app.features.tasks.dto.EisenhowerMatrixDTO;
import com.lockin.lockin_app.features.tasks.dto.TaskRequestDTO;
import com.lockin.lockin_app.features.tasks.dto.TaskResponseDTO;
import com.lockin.lockin_app.features.tasks.dto.TaskStatisticsDTO;
import com.lockin.lockin_app.features.tasks.entity.TaskStatus;
import com.lockin.lockin_app.features.tasks.service.TaskService;
import com.lockin.lockin_app.features.users.service.UserService;
import com.lockin.lockin_app.shared.controller.BaseController;

import jakarta.validation.Valid;

import lombok.extern.slf4j.Slf4j;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Slf4j
@RestController
@RequestMapping("/api/tasks")
public class TaskController extends BaseController {

    private final TaskService taskService;

    public TaskController(UserService userService, TaskService taskService) {
        super(userService);
        this.taskService = taskService;
    }

    /**
     * Gets paginated list of user's tasks
     *
     * @param page page number (default 0)
     * @param size page size (default 20)
     * @return paginated tasks sorted by creation date, descending
     */
    @GetMapping
    public ResponseEntity<Page<TaskResponseDTO>> getAllTasks(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @AuthenticationPrincipal UserDetails userDetails) {

        log.debug("GET /api/tasks: User: {}", getCurrentUserEmail(userDetails));

        Long userId = getCurrentUserId(userDetails);

        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<TaskResponseDTO> tasks = taskService.getTasksPaginated(userId, pageable);

        return ResponseEntity.ok(tasks);
    }

    @GetMapping("/{id}")
    public ResponseEntity<TaskResponseDTO> getTask(
            @PathVariable Long id, @AuthenticationPrincipal UserDetails userDetails) {

        log.debug("GET /api/tasks/{} : User: {}", id, getCurrentUserEmail(userDetails));

        Long userId = getCurrentUserId(userDetails);
        TaskResponseDTO task = taskService.getTask(id, userId);

        return ResponseEntity.ok(task);
    }

    /**
     * Creates a new task
     *
     * @param request task details
     * @return created task with generated ID
     */
    @PostMapping
    public ResponseEntity<TaskResponseDTO> createTask(
            @Valid @RequestBody TaskRequestDTO request,
            @AuthenticationPrincipal UserDetails userDetails) {

        log.debug("POST /api/tasks : User: {}", getCurrentUserEmail(userDetails));

        Long userId = getCurrentUserId(userDetails);
        TaskResponseDTO created = taskService.createTask(userId, request);

        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/{id}")
    public ResponseEntity<TaskResponseDTO> updateTask(
            @PathVariable Long id,
            @Valid @RequestBody TaskRequestDTO request,
            @AuthenticationPrincipal UserDetails userDetails) {

        log.debug("PUT /api/tasks/{} : User: {}", id, getCurrentUserEmail(userDetails));

        Long userId = getCurrentUserId(userDetails);
        TaskResponseDTO updated = taskService.updateTask(id, userId, request);

        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTask(
            @PathVariable Long id, @AuthenticationPrincipal UserDetails userDetails) {

        log.debug("DELETE /api/tasks/{} : User: {}", id, getCurrentUserEmail(userDetails));

        Long userId = getCurrentUserId(userDetails);
        taskService.deleteTask(id, userId);

        return ResponseEntity.noContent().build();
    }

    /**
     * Gets tasks by Eisenhower matrix quadrant
     *
     * <p>Quadrants: Urgent+Important (Do First), Not Urgent+Important (Schedule), Urgent+Not
     * Important (Delegate), Not Urgent+Not Important (Eliminate)
     *
     * @param isImportant boolean
     * @param isUrgent boolean
     * @return returns tasks by quadrant
     */
    @GetMapping("/quadrant")
    public ResponseEntity<List<TaskResponseDTO>> getTasksByQuadrant(
            @RequestParam Boolean isUrgent,
            @RequestParam Boolean isImportant,
            @AuthenticationPrincipal UserDetails userDetails) {

        log.debug("GET /api/tasks/quadrant : User: {}", getCurrentUserEmail(userDetails));

        Long userId = getCurrentUserId(userDetails);
        List<TaskResponseDTO> tasks = taskService.getTasksByQuadrant(userId, isUrgent, isImportant);
        return ResponseEntity.ok(tasks);
    }

    /**
     * gets complete Eisenhower Matrix
     *
     * @return returns complete Eisenhower matrix with all four quadrants populated
     */
    @GetMapping("/matrix")
    public ResponseEntity<EisenhowerMatrixDTO> getEisenhowerMatrix(
            @AuthenticationPrincipal UserDetails userDetails) {

        log.debug("GET /api/tasks/matrix : User: {}", getCurrentUserEmail(userDetails));

        Long userId = getCurrentUserId(userDetails);
        EisenhowerMatrixDTO matrix = taskService.getEisenhowerMatrix(userId);
        return ResponseEntity.ok(matrix);
    }

    @PatchMapping("/{id}/quadrant")
    public ResponseEntity<TaskResponseDTO> updateTaskQuadrant(
            @PathVariable Long id,
            @RequestParam Boolean isUrgent,
            @RequestParam Boolean isImportant,
            @AuthenticationPrincipal UserDetails userDetails) {

        log.debug("PATCH /api/tasks/{}/quadrant : User: {}", id, getCurrentUserEmail(userDetails));

        Long userId = getCurrentUserId(userDetails);
        TaskResponseDTO task = taskService.updateTaskQuadrant(id, userId, isUrgent, isImportant);
        return ResponseEntity.ok(task);
    }

    /**
     * Searches tasks by title or description
     *
     * @param query string being searched
     */
    @GetMapping("/search")
    public ResponseEntity<List<TaskResponseDTO>> searchTasks(
            @RequestParam String query, @AuthenticationPrincipal UserDetails userDetails) {

        log.debug(
                "GET /api/tasks/search : User: {} Search term: {}",
                getCurrentUserEmail(userDetails),
                query);

        Long userId = getCurrentUserId(userDetails);
        List<TaskResponseDTO> tasks = taskService.searchTasks(userId, query);
        return ResponseEntity.ok(tasks);
    }

    /**
     * Filters tasks by status, category and priority flags with pagination
     *
     * <p>All filters are optional. If no filters provided, returns all tasks.
     *
     * @param categoryId categoryId
     * @param isUrgent boolean
     * @param isImportant boolean
     * @param size number of items
     * @param status status
     * @param page page
     * @return returns filtered tasks
     */
    @GetMapping("/filter")
    public ResponseEntity<Page<TaskResponseDTO>> filterTasks(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) Long categoryId,
            @RequestParam(required = false) Boolean isUrgent,
            @RequestParam(required = false) Boolean isImportant,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @AuthenticationPrincipal UserDetails userDetails) {

        log.debug("GET /api/tasks/filter : User: {}", getCurrentUserEmail(userDetails));

        Long userId = getCurrentUserId(userDetails);

        TaskStatus taskStatus = null;
        if (status != null && !status.equals("all")) {
            taskStatus = TaskStatus.valueOf(status);
        }

        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());

        Page<TaskResponseDTO> tasks =
                taskService.getTasksWithFiltersPaginated(
                        userId, taskStatus, categoryId, isUrgent, isImportant, pageable);

        return ResponseEntity.ok(tasks);
    }

    @GetMapping("/statistics")
    public ResponseEntity<TaskStatisticsDTO> getStatistics(
            @AuthenticationPrincipal UserDetails userDetails) {

        Long userId = getCurrentUserId(userDetails);
        TaskStatisticsDTO stats = taskService.getStatistics(userId);
        return ResponseEntity.ok(stats);
    }

    @GetMapping("/incomplete")
    public ResponseEntity<List<TaskResponseDTO>> getIncompleteTasks(
            @AuthenticationPrincipal UserDetails userDetails) {

        log.debug("GET /api/tasks/incomplete : User: {}", getCurrentUserEmail(userDetails));

        Long userId = getCurrentUserId(userDetails);
        List<TaskResponseDTO> tasks = taskService.getIncompleteTasks(userId);

        return ResponseEntity.ok(tasks);
    }
}
