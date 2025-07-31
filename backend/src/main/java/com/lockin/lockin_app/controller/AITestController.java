package com.lockin.lockin_app.controller;

import com.lockin.lockin_app.ai.ClaudeAPIClient;
import com.lockin.lockin_app.ai.ClaudeResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequestMapping("/api/test/ai")
@RequiredArgsConstructor
public class AITestController {

    private final ClaudeAPIClient claudeAPIClient;

    @GetMapping("/hello")
    public ClaudeResponse testClaude() {
        log.info("Testing Claude API with hello message...");
        return claudeAPIClient.sendMessage(
                "You are a helpful task management assistant.",
                "Say hello"
        );
    }
}