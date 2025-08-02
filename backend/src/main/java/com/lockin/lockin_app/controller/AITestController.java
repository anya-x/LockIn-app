package com.lockin.lockin_app.controller;

import com.lockin.lockin_app.dto.TaskBreakdownResultDTO;
import com.lockin.lockin_app.service.ClaudeAPIClientService;
import com.lockin.lockin_app.dto.ClaudeResponseDTO;
import com.lockin.lockin_app.service.TaskBreakdownService;
import com.lockin.lockin_app.entity.Task;
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
    public TaskBreakdownResultDTO testBreakdown() {
        Task task = new Task();
        task.setTitle("Build authentication system");
        task.setDescription("User login and registration");


        return taskBreakdownService.breakdownTask(task);
    }
}