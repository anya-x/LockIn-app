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

@Slf4j
@Service
@RequiredArgsConstructor
public class TaskBreakdownService {

    private final ClaudeAPIClientService claudeAPIClientService;
    private final AIUsageRepository aiUsageRepository;
    private final UserRepository userRepository;
    private final RateLimitService rateLimitService;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public TaskBreakdownResultDTO breakdownTask(Task task) {
        log.info("Breaking down task entity: {}", task.getTitle());

        if (task.getTitle() == null || task.getTitle().trim().isEmpty()) {
            throw new IllegalArgumentException("Task title cannot be empty");
        }

        TaskBreakdownResultDTO result = breakdownTask(
                task.getTitle(),
                task.getDescription(),
                task.getUser().getId()
        );
        result.setOriginalTask(task);

        return result;
    }

    @Cacheable(value = "taskBreakdowns", key = "#title + '_' + (#description != null ? #description : '')")
    public TaskBreakdownResultDTO breakdownTask(String title, String description, Long userId) {
        log.info("Breaking down task: {} for user: {}", title, userId);

        rateLimitService.checkRateLimit(userId);

        if (title == null || title.trim().isEmpty()) {
            throw new IllegalArgumentException("Task title cannot be empty");
        }

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
                        ? description
                        : "No additional details provided"
        );

        try {
            ClaudeResponseDTO response = claudeAPIClientService.sendMessage(systemPrompt, userPrompt);
            String jsonText = cleanJsonResponse(response.getText());

            JsonNode root = objectMapper.readTree(jsonText);

            String reasoning = root.has("reasoning")
                    ? root.get("reasoning").asText()
                    : "No reasoning provided";

            List<SubtaskSuggestionDTO> subtasks = objectMapper.readValue(
                    root.get("subtasks").toString(),
                    new TypeReference<List<SubtaskSuggestionDTO>>() {}
            );

            log.info("Successfully broke down task into {} subtasks", subtasks.size());

            TaskBreakdownResultDTO result = new TaskBreakdownResultDTO(
                    null,
                    subtasks,
                    response.getTotalTokens(),
                    response.getEstimatedCost(),
                    reasoning
            );

            User user = userRepository.findById(userId)
                                      .orElseThrow(() -> new RuntimeException("User not found"));

            AIUsage usage = new AIUsage();
            usage.setUser(user);
            usage.setFeatureType("BREAKDOWN");
            usage.setTokensUsed(response.getTotalTokens());
            usage.setCostUSD(response.getEstimatedCost());
            usage.setRequestDetails(String.format("{\"title\":\"%s\"}", title.replace("\"", "\\\"")));

            aiUsageRepository.save(usage);

            log.info("Saved AI usage: {} tokens, ${}", usage.getTokensUsed(), usage.getCostUSD());

            return result;

        } catch (Exception e) {
            log.error("Failed to break down task: {}", e.getMessage());
            throw new RuntimeException("AI task breakdown failed: " + e.getMessage(), e);
        }
    }

    private String cleanJsonResponse(String response) {
        String cleaned = response.trim();

        if (cleaned.startsWith("```json")) {
            cleaned = cleaned.substring(7);
        } else if (cleaned.startsWith("```")) {
            cleaned = cleaned.substring(3);
        }
        if (cleaned.endsWith("```")) {
            cleaned = cleaned.substring(0, cleaned.length() - 3);
        }

        return cleaned.trim();
    }
}