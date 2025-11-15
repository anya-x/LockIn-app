package com.lockin.lockin_app.controller;

import com.lockin.lockin_app.ai.ClaudeAPIClient;
import com.lockin.lockin_app.ai.ClaudeResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

/**
 * Test controller for Claude API integration.
 *
 * COMMENTED OUT - Using real endpoints now
 * Keeping this code in case needed for debugging later
 */
// @Slf4j
// @RestController
// @RequestMapping("/api/test/ai")
// @RequiredArgsConstructor
public class AITestController {

    /*
    private final ClaudeAPIClient claudeAPIClient;

    @GetMapping("/hello")
    public ClaudeResponse testClaude() {
        log.info("Testing Claude API with hello message...");
        return claudeAPIClient.sendMessage(
            "You are a helpful task management assistant.",
            "Say hello and tell me you're ready to help with tasks!"
        );
    }

    @GetMapping("/breakdown")
    public ClaudeResponse testBreakdown(@RequestParam String task) {
        log.info("Testing task breakdown for: {}", task);
        return claudeAPIClient.sendMessage(
            "You are an expert at breaking down complex tasks into smaller, actionable steps.",
            "Break down this task: " + task
        );
    }
    */
}
