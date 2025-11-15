package com.lockin.lockin_app.ai;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.lockin.lockin_app.config.AnthropicConfig;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.*;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Client for interacting with Anthropic Claude API.
 *
 * Handles:
 * - Request formatting
 * - Error handling and retries
 * - Token usage tracking
 * - Response parsing
 *
 * BUGs/TODOs:
 * - No streaming support yet (responses can be slow for large outputs)
 * - Retry logic is basic (could be smarter with exponential backoff)
 * - No request queueing (could hit rate limits)
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class ClaudeAPIClient {

    private final AnthropicConfig anthropicConfig;
    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    /**
     * Send a message to Claude and get response.
     *
     * @param systemPrompt System instructions for Claude's behavior
     * @param userMessage The actual user's message/question
     * @return ClaudeResponse with text, tokens, and cost
     * @throws ClaudeAPIException if the API call fails
     */
    public ClaudeResponse sendMessage(String systemPrompt, String userMessage) {
        return sendMessageWithRetry(systemPrompt, userMessage, 3);
    }

    /**
     * Send message with retry logic.
     * Retries up to maxRetries times with 1 second delay between attempts.
     */
    private ClaudeResponse sendMessageWithRetry(
            String systemPrompt,
            String userMessage,
            int maxRetries) {

        int attempt = 0;
        Exception lastException = null;

        while (attempt < maxRetries) {
            try {
                return sendMessageInternal(systemPrompt, userMessage);
            } catch (Exception e) {
                lastException = e;
                attempt++;
                log.warn("Claude API attempt {} failed: {}", attempt, e.getMessage());

                if (attempt < maxRetries) {
                    try {
                        Thread.sleep(1000 * attempt); // Basic exponential backoff
                    } catch (InterruptedException ie) {
                        Thread.currentThread().interrupt();
                        throw new ClaudeAPIException("Retry interrupted", ie);
                    }
                }
            }
        }

        throw new ClaudeAPIException(
            "Claude API failed after " + maxRetries + " attempts",
            lastException
        );
    }

    /**
     * Internal method that does the actual API call.
     */
    private ClaudeResponse sendMessageInternal(String systemPrompt, String userMessage) {
        log.info("Calling Claude API (model: {})", anthropicConfig.getModel());

        try {
            // Build request headers
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("x-api-key", anthropicConfig.getKey());
            headers.set("anthropic-version", "2023-06-01");

            // Build request body
            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("model", anthropicConfig.getModel());
            requestBody.put("max_tokens", anthropicConfig.getMaxTokens());
            requestBody.put("temperature", anthropicConfig.getTemperature());
            requestBody.put("system", systemPrompt); // System prompt as separate field!

            // Messages array (just user message)
            Map<String, String> userMsg = new HashMap<>();
            userMsg.put("role", "user");
            userMsg.put("content", userMessage);
            requestBody.put("messages", List.of(userMsg));

            // Make the request
            HttpEntity<Map<String, Object>> request = new HttpEntity<>(requestBody, headers);

            ResponseEntity<String> response = restTemplate.exchange(
                anthropicConfig.getUrl(),
                HttpMethod.POST,
                request,
                String.class
            );

            // Parse response
            if (response.getStatusCode() == HttpStatus.OK) {
                return parseResponse(response.getBody());
            } else {
                throw new ClaudeAPIException(
                    "API returned status: " + response.getStatusCode()
                );
            }

        } catch (RestClientException e) {
            log.error("RestClient error calling Claude API", e);
            throw new ClaudeAPIException("Failed to call Claude API", e);
        }
    }

    /**
     * Parse the JSON response from Claude API.
     *
     * Response format:
     * {
     *   "id": "msg_...",
     *   "type": "message",
     *   "role": "assistant",
     *   "content": [{"type": "text", "text": "..."}],
     *   "model": "claude-3-5-sonnet-20241022",
     *   "usage": {"input_tokens": 15, "output_tokens": 45}
     * }
     */
    private ClaudeResponse parseResponse(String responseBody) {
        try {
            JsonNode root = objectMapper.readTree(responseBody);

            // Extract text from content array
            String text = "";
            if (root.has("content") && root.get("content").isArray()) {
                JsonNode content = root.get("content").get(0);
                if (content.has("text")) {
                    text = content.get("text").asText();
                }
            }

            // Extract token usage
            int inputTokens = 0;
            int outputTokens = 0;
            if (root.has("usage")) {
                JsonNode usage = root.get("usage");
                inputTokens = usage.get("input_tokens").asInt();
                outputTokens = usage.get("output_tokens").asInt();
            }

            log.info("Claude API response: {} chars, {} input tokens, {} output tokens",
                text.length(), inputTokens, outputTokens);

            return new ClaudeResponse(
                text,
                inputTokens,
                outputTokens,
                root.get("model").asText()
            );

        } catch (Exception e) {
            log.error("Failed to parse Claude API response", e);
            throw new ClaudeAPIException("Failed to parse API response", e);
        }
    }
}
