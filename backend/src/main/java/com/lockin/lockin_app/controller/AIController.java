package com.lockin.lockin_app.controller;

import com.lockin.lockin_app.dto.BreakdownRequest;
import com.lockin.lockin_app.dto.TaskBreakdownResult;
import com.lockin.lockin_app.service.RateLimitService;
import com.lockin.lockin_app.service.TaskBreakdownService;
import com.lockin.lockin_app.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userDetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * REST API for AI-powered features.
 *
 * All endpoints require authentication.
 * Users can only use AI features on their own data.
 */
@Slf4j
@RestController
@RequestMapping("/api/ai")
@RequiredArgsConstructor
public class AIController {

    private final TaskBreakdownService taskBreakdownService;
    private final UserService userService;
    private final RateLimitService rateLimitService;

    /**
     * Break down a task into subtasks using AI.
     *
     * POST /api/ai/breakdown
     * {
     *   "title": "Build a REST API",
     *   "description": "Need authentication and CRUD"
     * }
     *
     * Returns structured list of subtasks with time estimates.
     */
    @PostMapping("/breakdown")
    public ResponseEntity<?> breakdownTask(
            @Valid @RequestBody BreakdownRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {

        Long userId = userService.getUserIdFromEmail(userDetails.getUsername());

        // Check rate limit
        if (!rateLimitService.canMakeRequest(userId)) {
            int remaining = rateLimitService.getRemainingRequests(userId);
            return ResponseEntity.status(429) // Too Many Requests
                .body(Map.of(
                    "error", "Rate limit exceeded",
                    "message", "You can make " + remaining + " more requests today",
                    "limitResets", "in 24 hours"
                ));
        }

        log.info("User {} requesting task breakdown: {}",
            userDetails.getUsername(),
            request.getTitle());

        try {
            TaskBreakdownResult result = taskBreakdownService.breakdownTask(
                request.getTitle(),
                request.getDescription(),
                userId
            );

            log.info("Task breakdown successful. Cost: ${}, Tokens: {}",
                result.getCost(),
                result.getTotalTokens());

            return ResponseEntity.ok(result);

        } catch (Exception e) {
            log.error("Task breakdown failed", e);
            return ResponseEntity.internalServerError().build();
        }
    }
}
