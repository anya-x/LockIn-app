package com.lockin.lockin_app.controller;

import com.lockin.lockin_app.dto.BreakdownRequest;
import com.lockin.lockin_app.dto.TaskBreakdownResult;
import com.lockin.lockin_app.service.TaskBreakdownService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userDetails.UserDetails;
import org.springframework.web.bind.annotation.*;

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
    public ResponseEntity<TaskBreakdownResult> breakdownTask(
            @Valid @RequestBody BreakdownRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {

        log.info("User {} requesting task breakdown: {}",
            userDetails.getUsername(),
            request.getTitle());

        try {
            TaskBreakdownResult result = taskBreakdownService.breakdownTask(
                request.getTitle(),
                request.getDescription()
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
