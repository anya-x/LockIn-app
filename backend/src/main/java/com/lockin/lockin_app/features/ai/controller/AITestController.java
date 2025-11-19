package com.lockin.lockin_app.features.ai.controller;

import com.lockin.lockin_app.features.ai.dto.TaskBreakdownResultDTO;
import com.lockin.lockin_app.features.ai.service.ClaudeAPIClientService;
import com.lockin.lockin_app.features.ai.dto.ClaudeResponseDTO;
import com.lockin.lockin_app.features.ai.service.TaskBreakdownService;
import com.lockin.lockin_app.features.tasks.entity.Task;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequestMapping("/api/test/ai")
@RequiredArgsConstructor
public class AITestController {

    private final ClaudeAPIClientService claudeAPIClientService;
    private final TaskBreakdownService taskBreakdownService;

    @GetMapping("/hello")
    public ClaudeResponseDTO testClaude() {
        log.info("Testing Claude API with hello message...");
        return claudeAPIClientService.sendMessage(
                "You are a helpful task management assistant.",
                "Say hello"
        );
    }

    @GetMapping("/breakdown")
    public TaskBreakdownResultDTO testBreakdown(
            @RequestParam String title,
            @RequestParam(required = false) String description,
            @RequestParam(defaultValue = "1") Long userId) {
        log.warn("TEST ENDPOINT: Breaking down task without authentication - userId: {}", userId);
        return taskBreakdownService.breakdownTask(title, description, userId);
    }
}