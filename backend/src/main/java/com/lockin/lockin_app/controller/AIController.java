package com.lockin.lockin_app.controller;

import com.lockin.lockin_app.ai.TaskBreakdownResult;
import com.lockin.lockin_app.dto.TaskBreakdownRequest;
import com.lockin.lockin_app.entity.Task;
import com.lockin.lockin_app.entity.User;
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
 * KNOWN LIMITATIONS:
 * - No rate limiting (users can spam endpoints)
 * - No caching (identical requests hit Claude API multiple times)
 * - No cost tracking per user
 * - Generic error responses
 */
@Slf4j
@RestController
@RequestMapping("/api/ai")
@RequiredArgsConstructor
public class AIController {

    private final TaskBreakdownService taskBreakdownService;
    private final TaskService taskService;
    private final UserService userService;

    /**
     * Break down an existing task into subtasks using AI.
     *
     * POST /api/ai/breakdown/{taskId}
     *
     * Example response:
     * {
     *   "originalTask": { ... },
     *   "subtasks": [
     *     {
     *       "title": "Create User entity with JPA annotations",
     *       "description": "Define User model with id, email, password fields",
     *       "estimatedMinutes": 20,
     *       "priority": "HIGH"
     *     },
     *     ...
     *   ],
     *   "tokensUsed": 385,
     *   "costUSD": 0.00693
     * }
     *
     * @param taskId ID of the task to break down
     * @param userDetails Authenticated user
     * @return Breakdown result with 3-7 suggested subtasks
     */
    @PostMapping("/breakdown/{taskId}")
    public ResponseEntity<TaskBreakdownResult> breakdownTask(
            @PathVariable Long taskId,
            @AuthenticationPrincipal UserDetails userDetails) {

        Long userId = userService.getUserIdFromEmail(userDetails.getUsername());

        log.info("AI breakdown requested for task {} by user {}",
                taskId, userDetails.getUsername());

        try {
            // Get task and verify ownership (throws exception if not owned)
            Task task = taskService.getTaskEntityById(taskId, userId);

            // TODO: Add rate limiting (10 requests per day per user)
            // TODO: Add caching to avoid duplicate API calls for same task
            // TODO: Track total cost per user

            TaskBreakdownResult result = taskBreakdownService.breakdownTask(task);

            log.info("AI breakdown successful: {} subtasks, ${} cost, {} tokens",
                    result.getSubtasks().size(),
                    String.format("%.4f", result.getCostUSD()),
                    result.getTokensUsed());

            return ResponseEntity.ok(result);

        } catch (IllegalArgumentException e) {
            log.error("Invalid request: {}", e.getMessage());
            // TODO: Return proper error DTO instead of generic 500
            return ResponseEntity.badRequest().build();

        } catch (Exception e) {
            log.error("AI breakdown failed for task {}: {}", taskId, e.getMessage());
            // TODO: More specific error responses
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * Break down a new task (not yet saved to database).
     *
     * POST /api/ai/breakdown-preview
     * Body: { "title": "Build authentication", "description": "JWT tokens and login" }
     *
     * Useful for getting AI suggestions BEFORE creating the task.
     * This helps users refine their task breakdown before saving.
     *
     * @param request Task title and description
     * @param userDetails Authenticated user
     * @return Breakdown result with suggested subtasks
     */
    @PostMapping("/breakdown-preview")
    public ResponseEntity<TaskBreakdownResult> breakdownPreview(
            @Valid @RequestBody TaskBreakdownRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {

        Long userId = userService.getUserIdFromEmail(userDetails.getUsername());

        log.info("AI breakdown preview requested by user {}: '{}'",
                userDetails.getUsername(), request.getTitle());

        try {
            // Create temporary task object (not saved to DB)
            Task tempTask = new Task();
            tempTask.setTitle(request.getTitle());
            tempTask.setDescription(request.getDescription());

            // Set user for logging purposes (not persisted)
            User user = new User();
            user.setId(userId);
            tempTask.setUser(user);

            TaskBreakdownResult result = taskBreakdownService.breakdownTask(tempTask);

            log.info("AI breakdown preview successful: {} subtasks, ${} cost",
                    result.getSubtasks().size(),
                    String.format("%.4f", result.getCostUSD()));

            return ResponseEntity.ok(result);

        } catch (IllegalArgumentException e) {
            log.error("Invalid preview request: {}", e.getMessage());
            return ResponseEntity.badRequest().build();

        } catch (Exception e) {
            log.error("AI breakdown preview failed: {}", e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }
}
