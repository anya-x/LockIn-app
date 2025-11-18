package com.lockin.lockin_app.controller;

import com.lockin.lockin_app.dto.TaskBreakdownRequestDTO;
import com.lockin.lockin_app.dto.TaskBreakdownResultDTO;
import com.lockin.lockin_app.entity.Task;
import com.lockin.lockin_app.entity.User;
import com.lockin.lockin_app.service.RateLimitService;
import com.lockin.lockin_app.service.TaskBreakdownService;
import com.lockin.lockin_app.service.TaskService;
import com.lockin.lockin_app.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

/**
 * REST API for AI-powered features.
 *
 * SECURITY NOTE: All endpoints require authentication.
 * Users can only use AI features on their own tasks.
 *
 * CURRENT LIMITATIONS:
 * - No rate limiting yet (TODO: Add 10 requests per day limit)
 * - No cost tracking per user
 * - No caching for identical requests
 * - Generic error responses (TODO: Add specific error DTOs)
 */
@Slf4j
@RestController
@RequestMapping("/api/ai")
@RequiredArgsConstructor
public class AIController {

    private final TaskBreakdownService taskBreakdownService;
    private final TaskService taskService;
    private final UserService userService;
    private final RateLimitService rateLimitService;

    /**
     * Break down an existing task into subtasks using AI.
     *
     * POST /api/ai/breakdown/{taskId}
     *
     * This endpoint:
     * 1. Fetches the task from database
     * 2. Verifies user ownership
     * 3. Sends task to Claude AI for breakdown
     * 4. Returns suggested subtasks with reasoning
     *
     * @param taskId ID of the task to break down
     * @param userDetails Authenticated user
     * @return Breakdown result with suggested subtasks
     */
    @PostMapping("/breakdown/{taskId}")
    public ResponseEntity<TaskBreakdownResultDTO> breakdownTask(
            @PathVariable Long taskId,
            @AuthenticationPrincipal UserDetails userDetails) {

        log.info("AI breakdown requested for task {} by user {}", taskId, userDetails.getUsername());

        // Get userId from authenticated user
        Long userId = userService.getUserIdFromEmail(userDetails.getUsername());

        // Check rate limit before processing
        rateLimitService.checkRateLimit(userId);

        // Get task and verify ownership (throws exception if not found or not owned)
        Task task = taskService.getTaskEntity(taskId, userId);

        try {
            // Use the new overload that tracks usage
            TaskBreakdownResultDTO result = taskBreakdownService.breakdownTask(
                    task.getTitle(),
                    task.getDescription(),
                    userId
            );

            log.info("AI breakdown successful: {} subtasks, ${} cost",
                    result.getSubtasks().size(),
                    String.format("%.4f", result.getCostUSD()));

            return ResponseEntity.ok(result);

        } catch (IllegalArgumentException e) {
            log.error("Invalid request: {}", e.getMessage());
            // BUG: Should return 400 Bad Request with error message
            throw e;
        } catch (Exception e) {
            log.error("AI breakdown failed: {}", e.getMessage());
            // BUG: Generic error response - should be more specific
            throw new RuntimeException("AI task breakdown failed: " + e.getMessage(), e);
        }
    }

    /**
     * Break down a new task (not yet saved to database) into subtasks.
     *
     * POST /api/ai/breakdown-preview
     * Body: { "title": "...", "description": "..." }
     *
     * This endpoint is useful for getting AI suggestions before creating the task.
     * It doesn't require an existing task ID, just title and description.
     *
     * Use case: User types a task title and wants AI breakdown suggestions
     * before deciding whether to create the task.
     *
     * @param request Task title and description
     * @param userDetails Authenticated user
     * @return Breakdown result with suggested subtasks
     */
    @PostMapping("/breakdown-preview")
    public ResponseEntity<TaskBreakdownResultDTO> breakdownPreview(
            @Valid @RequestBody TaskBreakdownRequestDTO request,
            @AuthenticationPrincipal UserDetails userDetails) {

        log.info("AI breakdown preview requested by user {} for task: {}",
                userDetails.getUsername(), request.getTitle());

        // Get userId from authenticated user
        Long userId = userService.getUserIdFromEmail(userDetails.getUsername());

        // Check rate limit before processing
        rateLimitService.checkRateLimit(userId);

        // Create temporary task object (not saved to DB)
        // This is just for AI processing, won't be persisted
        Task tempTask = new Task();
        tempTask.setTitle(request.getTitle());
        tempTask.setDescription(request.getDescription());

        // Set user reference (needed for potential future features)
        User user = userService.getUserById(userId);
        tempTask.setUser(user);

        try {
            // Use the new overload that tracks usage
            TaskBreakdownResultDTO result = taskBreakdownService.breakdownTask(
                    request.getTitle(),
                    request.getDescription(),
                    userId
            );

            log.info("AI breakdown preview successful: {} subtasks, ${} cost",
                    result.getSubtasks().size(),
                    String.format("%.4f", result.getCostUSD()));

            return ResponseEntity.ok(result);

        } catch (IllegalArgumentException e) {
            log.error("Invalid request: {}", e.getMessage());
            throw e;
        } catch (Exception e) {
            log.error("AI breakdown preview failed: {}", e.getMessage());
            throw new RuntimeException("AI task breakdown failed: " + e.getMessage(), e);
        }
    }
}
