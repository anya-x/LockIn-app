package com.lockin.lockin_app.service;


import com.lockin.lockin_app.ai.ClaudeAPIClient;
import com.lockin.lockin_app.ai.ClaudeResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class TaskBreakdownService {

    private final ClaudeAPIClient claudeAPIClient;

    public String breakdownTask(String title, String description) {
        log.info("Breaking down task: {}", title);

        String systemPrompt = "You are an expert at breaking down tasks.";

        String userPrompt = String.format(
                "Break down this task: %s%nDescription: %s",
                title,
                description != null ? description : "No description provided"
        );

        ClaudeResponse response = claudeAPIClient.sendMessage(systemPrompt, userPrompt);
        
        return response.getText();
    }
}
