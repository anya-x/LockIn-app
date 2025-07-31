package com.lockin.lockin_app.ai;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.lockin.lockin_app.config.AnthropicConfig;
import com.lockin.lockin_app.exception.ClaudeAPIException;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import org.springframework.http.*;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@Component
@RequiredArgsConstructor
public class ClaudeAPIClient {

    private final AnthropicConfig anthropicConfig;
    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();


    public ClaudeResponse sendMessage(String systemPrompt, String userMessage) {
        return sendMessageWithRetry(systemPrompt, userMessage, 3);
    }


    private ClaudeResponse sendMessageWithRetry(
            String systemPrompt, String userMessage, int maxRetries) {

        int attempt = 0;
        Exception lastException = null;

        while (attempt < maxRetries) {
            try {
                return sendMessageInternal(systemPrompt, userMessage);
            } catch (Exception e) {
                lastException = e;
                attempt++;
                log.warn(" API attempt {} failed: {}", attempt, e.getMessage());

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
                "Claude API failed after " + maxRetries + " attempts", lastException);
    }
    private ClaudeResponse sendMessageInternal(String systemPrompt, String userMessage) {
        log.info("Calling Claude API");

        try {
            // request headers
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("x-api-key", anthropicConfig.getKey());
            headers.set("anthropic-version", "2025-05-14");

            // request body
            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("model", anthropicConfig.getModel());
            requestBody.put("max_tokens", anthropicConfig.getMaxTokens());
            requestBody.put("temperature", anthropicConfig.getTemperature());
            requestBody.put("system", systemPrompt); // System prompt as separate field!

            //  user message
            Map<String, String> userMsg = new HashMap<>();
            userMsg.put("role", "user");
            userMsg.put("content", userMessage);
            requestBody.put("messages", List.of(userMsg));

            // request
            HttpEntity<Map<String, Object>> request = new HttpEntity<>(requestBody, headers);

            ResponseEntity<String> response =
                    restTemplate.exchange(
                            anthropicConfig.getUrl(), HttpMethod.POST, request, String.class);

            //response
            if (response.getStatusCode() == HttpStatus.OK) {
                return parseResponse(response.getBody());
            } else {
                throw new ClaudeAPIException("API returned status: " + response.getStatusCode());
            }

        } catch (RestClientException e) {
            log.error("RestClient error ");
            throw new ClaudeAPIException("Failed to call Claude API", e);
        }
    }


    private ClaudeResponse parseResponse(String responseBody) {
        try {
            JsonNode root = objectMapper.readTree(responseBody);

            String text = "";
            if (root.has("content") && root.get("content").isArray()) {
                JsonNode content = root.get("content").get(0);
                if (content.has("text")) {
                    text = content.get("text").asText();
                }
            }

            int inputTokens = 0;
            int outputTokens = 0;
            if (root.has("usage")) {
                JsonNode usage = root.get("usage");
                inputTokens = usage.get("input_tokens").asInt();
                outputTokens = usage.get("output_tokens").asInt();
            }

            log.info(
                    "Claude API response: {} chars, {} input tokens, {} output tokens",
                    text.length(),
                    inputTokens,
                    outputTokens);

            return new ClaudeResponse(text, inputTokens, outputTokens, root.get("model").asText());

        } catch (Exception e) {
            log.error("Failed to parse Claude API response", e);
            throw new ClaudeAPIException("Failed to parse API response", e);
        }
    }
}
