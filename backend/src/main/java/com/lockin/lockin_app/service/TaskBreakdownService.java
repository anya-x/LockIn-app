package com.lockin.lockin_app.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.lockin.lockin_app.dto.ClaudeResponseDTO;
import com.lockin.lockin_app.dto.SubtaskSuggestionDTO;
import com.lockin.lockin_app.dto.TaskBreakdownResultDTO;
import com.lockin.lockin_app.entity.AIUsage;
import com.lockin.lockin_app.entity.Task;
import com.lockin.lockin_app.entity.User;
import com.lockin.lockin_app.repository.AIUsageRepository;
import com.lockin.lockin_app.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * Service for breaking down complex tasks into subtasks using AI.
 *
 * REALITY CHECK: Prompt engineering took multiple iterations!
 * - Spent hours getting Claude to return valid JSON
 * - Response quality varies with task complexity
 * - JSON parsing is fragile - needs cleanup for markdown wrappers
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class TaskBreakdownService {

    private final ClaudeAPIClientService claudeAPIClientService;
    private final AIUsageRepository aiUsageRepository;
    private final UserRepository userRepository;
    private final ObjectMapper objectMapper = new ObjectMapper();

    /**
     * Break down a task entity into subtasks using AI.
     *
     * @param task The task entity to break down
     * @return Breakdown result with suggested subtasks
     */
    public TaskBreakdownResultDTO breakdownTask(Task task) {
        log.info("Breaking down task entity: {}", task.getTitle());

        // Validation
        if (task.getTitle() == null || task.getTitle().trim().isEmpty()) {
            throw new IllegalArgumentException("Task title cannot be empty");
        }

        TaskBreakdownResultDTO result = breakdownTask(
            task.getTitle(),
            task.getDescription()
        );

        // Set the original task reference
        result.setOriginalTask(task);

        return result;
    }

    /**
     * Break down a task by title and description into subtasks using AI WITH usage tracking.
     *
     * @param title Task title
     * @param description Task description (can be null/empty)
     * @param userId User ID for usage tracking
     * @return Breakdown result with suggested subtasks
     */
    public TaskBreakdownResultDTO breakdownTask(String title, String description, Long userId) {
        log.info("Breaking down task: {} for user: {}", title, userId);

        // Validation
        if (title == null || title.trim().isEmpty()) {
            throw new IllegalArgumentException("Task title cannot be empty");
        }

        // Call Claude API
        TaskBreakdownResultDTO result = breakdownTask(title, description);

        // Save usage record
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        AIUsage usage = new AIUsage();
        usage.setUser(user);
        usage.setFeatureType("BREAKDOWN");
        usage.setTokensUsed(result.getTokensUsed());
        usage.setCostUSD(result.getCostUSD());
        usage.setRequestDetails(String.format("{\"title\":\"%s\"}", title.replace("\"", "\\\"")));
        // TODO: Save response details

        aiUsageRepository.save(usage);

        log.info("Saved AI usage: {} tokens, ${}", usage.getTokensUsed(), usage.getCostUSD());

        return result;
    }

    /**
     * Break down a task by title and description into subtasks using AI.
     *
     * ITERATION #3 - Final prompt that handles edge cases:
     * - Works for detailed tasks ✓
     * - Handles vague tasks gracefully ✓
     * - Always returns valid JSON ✓
     * - Includes reasoning for transparency ✓
     *
     * CACHEABLE: Results cached for 1 hour to reduce API costs.
     * Cache key: title + description
     *
     * @param title Task title
     * @param description Task description (can be null/empty)
     * @return Breakdown result with suggested subtasks
     */
    @Cacheable(value = "taskBreakdowns", key = "#title + ':' + (#description != null ? #description : '')")
    public TaskBreakdownResultDTO breakdownTask(String title, String description) {
        log.info("Breaking down task: {}", title);

        // Validation
        if (title == null || title.trim().isEmpty()) {
            throw new IllegalArgumentException("Task title cannot be empty");
        }

        // IMPROVED PROMPT v3 - Explicitly request JSON with reasoning
        String systemPrompt = """
            You are a productivity assistant that breaks down tasks into actionable subtasks.
            You MUST always respond with valid JSON object, even for vague tasks.
            If the task is vague, make reasonable assumptions and create general subtasks.

            Your response must include:
            1. A brief reasoning explaining your breakdown approach
            2. An array of 3-7 actionable subtasks
            """;

        String userPrompt = String.format(
                """
                Break down this task into 3-7 actionable subtasks.

                Task Title: "%s"
                Description: "%s"

                RULES:
                1. ALWAYS return valid JSON object (no other text)
                2. If task is vague, make reasonable assumptions
                3. Each subtask must start with action verb
                4. Estimate realistic time (15-90 minutes per subtask)
                5. Assign priority: HIGH (urgent), MEDIUM (important), or LOW (optional)

                JSON Format (respond with ONLY this, no other text):
                {
                  "reasoning": "Brief explanation of your breakdown approach",
                  "subtasks": [
                    {
                      "title": "Action verb + specific task",
                      "description": "What and how to do it",
                      "estimatedMinutes": 30,
                      "priority": "MEDIUM"
                    }
                  ]
                }

                CRITICAL: Return ONLY the JSON object, absolutely no other text.
                """,
                title,
                description != null && !description.trim().isEmpty()
                        ? description.trim()
                        : "No additional details provided"
        );

        try {
            ClaudeResponseDTO response = claudeAPIClientService.sendMessage(systemPrompt, userPrompt);

            // Clean markdown wrappers (Claude sometimes wraps JSON in ```json ... ```)
            String jsonText = cleanJsonResponse(response.getText());

            // Parse the response as JSON object (not array anymore)
            JsonNode root = objectMapper.readTree(jsonText);

            // Extract reasoning
            String reasoning = root.has("reasoning")
                ? root.get("reasoning").asText()
                : "No reasoning provided";

            // Extract subtasks array
            List<SubtaskSuggestionDTO> subtasks = objectMapper.readValue(
                    root.get("subtasks").toString(),
                    new TypeReference<List<SubtaskSuggestionDTO>>() {}
            );

            log.info("Successfully broke down task into {} subtasks", subtasks.size());

            return new TaskBreakdownResultDTO(
                    null, // originalTask - will be set by caller if needed
                    subtasks,
                    response.getTotalTokens(),
                    response.getEstimatedCost(),
                    reasoning
            );

        } catch (Exception e) {
            log.error("Failed to break down task: {}", e.getMessage());
            throw new RuntimeException("AI task breakdown failed: " + e.getMessage(), e);
        }
    }

    /**
     * Clean JSON response by removing markdown code block wrappers.
     *
     * Claude sometimes wraps JSON in:
     * ```json
     * { ... }
     * ```
     *
     * This method strips that formatting.
     */
    private String cleanJsonResponse(String response) {
        String cleaned = response.trim();

        // Remove ```json and ```
        if (cleaned.startsWith("```json")) {
            cleaned = cleaned.substring(7); // Remove ```json
        } else if (cleaned.startsWith("```")) {
            cleaned = cleaned.substring(3); // Remove ```
        }

        if (cleaned.endsWith("```")) {
            cleaned = cleaned.substring(0, cleaned.length() - 3);
        }

        return cleaned.trim();
    }
}