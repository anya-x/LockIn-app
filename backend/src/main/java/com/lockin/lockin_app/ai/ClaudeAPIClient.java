package com.lockin.lockin_app.ai;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.lockin.lockin_app.config.AnthropicConfig;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.*;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Client for interacting with Anthropic Claude API.
 *
 * WIP: Basic structure, need to add:
 * - Retry logic
 * - Better error handling
 * - Token tracking
 * - Response parsing
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class ClaudeAPIClient {

    private final AnthropicConfig anthropicConfig;
    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    // TODO: Implement sendMessage method
    // TODO: Add retry logic
    // TODO: Parse response properly

    /**
     * Send a message to Claude and get response.
     *
     * WIP: Basic implementation, needs work!
     */
    public String sendMessage(String systemPrompt, String userMessage) {
        log.info("Sending message to Claude API...");

        // Build request body
        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("model", anthropicConfig.getModel());
        requestBody.put("max_tokens", anthropicConfig.getMaxTokens());
        requestBody.put("temperature", anthropicConfig.getTemperature());

        // Add system message
        Map<String, String> systemMsg = new HashMap<>();
        systemMsg.put("role", "system");
        systemMsg.put("content", systemPrompt);

        // Add user message
        Map<String, String> userMsg = new HashMap<>();
        userMsg.put("role", "user");
        userMsg.put("content", userMessage);

        requestBody.put("messages", List.of(systemMsg, userMsg));

        // TODO: Send request and parse response
        // This is a stub for now
        return "Not implemented yet";
    }
}
