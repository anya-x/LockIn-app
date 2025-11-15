package com.lockin.lockin_app.service;

import com.lockin.lockin_app.ai.ClaudeAPIClient;
import com.lockin.lockin_app.ai.ClaudeResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

/**
 * Service for breaking down tasks using AI.
 *
 * WIP: Basic structure, needs proper prompt engineering
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class TaskBreakdownService {

    private final ClaudeAPIClient claudeAPIClient;

    /**
     * Break down a task into subtasks.
     *
     * WIP: Prompt needs work, response parsing incomplete
     */
    public String breakdownTask(String title, String description) {
        log.info("Breaking down task: {}", title);

        String systemPrompt = "You are a task breakdown expert.";

        String userPrompt = String.format(
            "Break down this task: %s\nDescription: %s",
            title,
            description != null ? description : "No description provided"
        );

        ClaudeResponse response = claudeAPIClient.sendMessage(systemPrompt, userPrompt);

        // TODO: Parse response into structured subtasks
        // TODO: Estimate time for each
        // TODO: Assign priorities

        return response.getText();
    }
}
