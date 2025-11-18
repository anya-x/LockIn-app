package com.lockin.lockin_app.controller;

import com.lockin.lockin_app.ai.ClaudeAPIClient;
import com.lockin.lockin_app.ai.ClaudeResponse;
import com.lockin.lockin_app.ai.TaskBreakdownResult;
import com.lockin.lockin_app.entity.Task;
import com.lockin.lockin_app.service.TaskBreakdownService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

/**
 * Test endpoints for AI features.
 *
 * WARNING: These endpoints have no authentication!
 * Only use in development/testing environments.
 */
@Slf4j
@RestController
@RequestMapping("/api/test/ai")
@RequiredArgsConstructor
public class AITestController {

    private final ClaudeAPIClient claudeAPIClient;
    private final TaskBreakdownService taskBreakdownService;

    /**
     * Test basic Claude API connectivity.
     *
     * GET /api/test/ai/hello
     */
    @GetMapping("/hello")
    public ClaudeResponse testClaude() {
        log.info("Testing Claude API with hello message...");
        return claudeAPIClient.sendMessage(
                "You are a helpful task management assistant.",
                "Say hello"
        );
    }

    /**
     * Test task breakdown with a predefined task.
     *
     * GET /api/test/ai/breakdown
     *
     * Tests the full breakdown pipeline:
     * - Prompt construction
     * - API call
     * - JSON parsing
     * - DTO mapping
     */
    @GetMapping("/breakdown")
    public TaskBreakdownResult testBreakdown() {
        log.info("Testing task breakdown with sample task...");

        Task task = new Task();
        task.setTitle("Build user authentication system");
        task.setDescription("Need JWT tokens, login, registration, and password reset functionality");

        return taskBreakdownService.breakdownTask(task);
    }

    /**
     * Test task breakdown with custom task details.
     *
     * GET /api/test/ai/breakdown-custom?title=...&description=...
     *
     * Useful for testing different task types and edge cases.
     */
    @GetMapping("/breakdown-custom")
    public TaskBreakdownResult testBreakdownCustom(
            @RequestParam String title,
            @RequestParam(required = false) String description) {

        log.info("Testing task breakdown with custom task: {}", title);

        Task task = new Task();
        task.setTitle(title);
        task.setDescription(description);

        return taskBreakdownService.breakdownTask(task);
    }
}