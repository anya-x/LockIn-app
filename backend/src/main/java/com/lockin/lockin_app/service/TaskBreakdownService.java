package com.lockin.lockin_app.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.lockin.lockin_app.ai.ClaudeAPIClient;
import com.lockin.lockin_app.ai.ClaudeResponse;
import com.lockin.lockin_app.dto.SubtaskDTO;
import com.lockin.lockin_app.dto.TaskBreakdownResult;
import com.lockin.lockin_app.entity.AIUsage;
import com.lockin.lockin_app.entity.User;
import com.lockin.lockin_app.repository.AIUsageRepository;
import com.lockin.lockin_app.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * Service for breaking down tasks using AI.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class TaskBreakdownService {

    private final ClaudeAPIClient claudeAPIClient;
    private final AIUsageRepository aiUsageRepository;
    private final UserRepository userRepository;
    private final AICache aiCache;
    private final ObjectMapper objectMapper = new ObjectMapper();

    /**
     * Break down a task into subtasks.
     *
     * @param title The main task title
     * @param description Optional description with context
     * @param userId The ID of the user making the request
     * @return TaskBreakdownResult with structured subtasks
     */
    public TaskBreakdownResult breakdownTask(String title, String description, Long userId) {
        // Create cache key from title + description
        String cacheKey = "breakdown:" + title + ":" +
            (description != null ? description.hashCode() : "");

        // Check cache first
        TaskBreakdownResult cached = aiCache.get(cacheKey, TaskBreakdownResult.class);
        if (cached != null) {
            log.info("Returning cached breakdown for: {}", title);
            // Still count as usage for rate limiting, but no cost!
            saveUsageRecord(userId, cached, true);
            return cached;
        }

        // Cache miss - call Claude API
        log.info("Cache miss, calling Claude API for: {}", title);

        // Improved system prompt with clear instructions
        String systemPrompt = """
            You are an expert at breaking down complex tasks into smaller, actionable steps.

            When given a task, you should:
            1. Break it into 3-7 concrete, actionable subtasks
            2. Each subtask should be specific and achievable
            3. Estimate time needed for each (in minutes)
            4. Suggest priority (urgent/important/normal/low)

            Respond ONLY with a JSON array of subtasks, no other text:
            [
              {
                "title": "Specific action to take",
                "description": "Brief details about this step",
                "estimatedMinutes": 30,
                "priority": "urgent"
              }
            ]

            Priority levels: urgent, important, normal, low
            Time estimates: Be realistic (15-120 minutes per subtask)
            """;

        // User prompt with context
        String userPrompt = String.format(
            "Break down this task:\n\nTitle: %s\n\nDescription: %s\n\nProvide the breakdown as JSON.",
            title,
            description != null && !description.trim().isEmpty()
                ? description
                : "No additional context provided"
        );

        try {
            ClaudeResponse response = claudeAPIClient.sendMessage(systemPrompt, userPrompt);

            // Parse JSON response
            String jsonText = response.getText().trim();

            // Sometimes Claude wraps in markdown, remove it
            if (jsonText.startsWith("```json")) {
                jsonText = jsonText.substring(7); // Remove ```json
            }
            if (jsonText.startsWith("```")) {
                jsonText = jsonText.substring(3); // Remove ```
            }
            if (jsonText.endsWith("```")) {
                jsonText = jsonText.substring(0, jsonText.length() - 3);
            }
            jsonText = jsonText.trim();

            // Parse to list of subtasks
            List<SubtaskDTO> subtasks = objectMapper.readValue(
                jsonText,
                new TypeReference<List<SubtaskDTO>>() {}
            );

            log.info("Successfully broke down task into {} subtasks", subtasks.size());
            log.info("Cost: ${}, Tokens: {}",
                response.getEstimatedCostUSD(),
                response.getTotalTokens());

            // Create result
            TaskBreakdownResult result = new TaskBreakdownResult(
                subtasks,
                response.getEstimatedCostUSD(),
                response.getTotalTokens()
            );

            // Save usage record (not from cache)
            saveUsageRecord(userId, result, false);

            // Cache the result
            aiCache.put(cacheKey, result);

            return result;

        } catch (Exception e) {
            log.error("Failed to break down task", e);
            throw new RuntimeException("Failed to break down task: " + e.getMessage(), e);
        }
    }

    private void saveUsageRecord(Long userId, TaskBreakdownResult result, boolean fromCache) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new RuntimeException("User not found"));

        AIUsage usage = new AIUsage();
        usage.setUser(user);
        usage.setFeatureType("BREAKDOWN" + (fromCache ? "_CACHED" : ""));
        usage.setTokensUsed(fromCache ? 0 : result.getTotalTokens());
        usage.setCostUSD(fromCache ? 0.0 : result.getCost());

        aiUsageRepository.save(usage);

        log.info("Saved AI usage: {} tokens, ${}, cached: {}",
            usage.getTokensUsed(),
            usage.getCostUSD(),
            fromCache);
    }
}
