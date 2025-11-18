package com.lockin.lockin_app.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.lockin.lockin_app.ai.ClaudeAPIClient;
import com.lockin.lockin_app.ai.ClaudeResponse;
import com.lockin.lockin_app.ai.SubtaskSuggestion;
import com.lockin.lockin_app.ai.TaskBreakdownResult;
import com.lockin.lockin_app.entity.Task;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

/**
 * Service for breaking down complex tasks into subtasks using AI.
 *
 * IMPLEMENTATION NOTES:
 * - Prompt engineering required multiple iterations to get consistent JSON output
 * - Claude sometimes wraps JSON in markdown code blocks (handled by cleanJsonResponse)
 * - Response quality varies - vague tasks get general subtask suggestions
 * - Cost per breakdown: ~$0.005-0.01 USD depending on task complexity
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class TaskBreakdownService {

    private final ClaudeAPIClient claudeAPIClient;
    private final ObjectMapper objectMapper;

    /**
     * Break down a task into subtasks using AI.
     *
     * @param task The task to break down
     * @return TaskBreakdownResult with 3-7 suggested subtasks
     * @throws IllegalArgumentException if task title is empty
     * @throws RuntimeException if AI breakdown fails
     */
    public TaskBreakdownResult breakdownTask(Task task) {
        // Validation
        if (task.getTitle() == null || task.getTitle().trim().isEmpty()) {
            throw new IllegalArgumentException("Task title cannot be empty");
        }

        log.info("Breaking down task: {}", task.getTitle());

        // Build prompts (v3 - refined after multiple iterations)
        String systemPrompt = buildSystemPrompt();
        String userPrompt = buildUserPrompt(task);

        try {
            ClaudeResponse response = claudeAPIClient.sendMessage(systemPrompt, userPrompt);

            // Clean and parse JSON response
            String jsonText = cleanJsonResponse(response.getText());
            JsonNode subtasksNode = objectMapper.readTree(jsonText);

            // Build result
            TaskBreakdownResult result = new TaskBreakdownResult();
            result.setOriginalTask(task);
            result.setSubtasks(parseSubtasks(subtasksNode));
            result.setTokensUsed(response.getTotalTokens());
            result.setCostUSD(response.getEstimatedCostUSD());

            log.info("Successfully broke down task into {} subtasks, cost: ${}, tokens: {}",
                    result.getSubtasks().size(),
                    String.format("%.4f", result.getCostUSD()),
                    result.getTokensUsed());

            return result;

        } catch (Exception e) {
            log.error("Failed to break down task '{}': {}", task.getTitle(), e.getMessage());
            throw new RuntimeException("AI task breakdown failed: " + e.getMessage(), e);
        }
    }

    /**
     * Build the system prompt.
     * Explicitly requires JSON-only output to avoid natural language responses.
     */
    private String buildSystemPrompt() {
        return "You are a productivity assistant. " +
                "You MUST always respond with valid JSON array, even for vague tasks. " +
                "If the task is vague, make reasonable assumptions and create general subtasks.";
    }

    /**
     * Build the user prompt with clear formatting instructions.
     * This prompt evolved through multiple iterations to handle edge cases.
     */
    private String buildUserPrompt(Task task) {
        return String.format(
                "Break down this task into 3-7 actionable subtasks.\n\n" +
                        "Task Title: \"%s\"\n" +
                        "Description: \"%s\"\n\n" +
                        "RULES:\n" +
                        "1. ALWAYS return valid JSON array (no other text)\n" +
                        "2. If task is vague, make reasonable assumptions\n" +
                        "3. Each subtask must start with action verb\n" +
                        "4. Estimate realistic time (15-90 minutes per subtask)\n" +
                        "5. Assign priority: HIGH (urgent), MEDIUM (important), or LOW (optional)\n\n" +
                        "JSON Format:\n" +
                        "[\n" +
                        "  {\n" +
                        "    \"title\": \"Verb + specific action\",\n" +
                        "    \"description\": \"What and how\",\n" +
                        "    \"estimatedMinutes\": 30,\n" +
                        "    \"priority\": \"MEDIUM\"\n" +
                        "  }\n" +
                        "]\n\n" +
                        "CRITICAL: Return ONLY the JSON array, absolutely no other text.",
                task.getTitle(),
                task.getDescription() != null && !task.getDescription().isEmpty()
                        ? task.getDescription()
                        : "No additional details provided"
        );
    }

    /**
     * Clean JSON response by removing markdown code block wrappers.
     *
     * Claude sometimes wraps JSON in ```json...``` blocks.
     * This method strips those wrappers to extract pure JSON.
     */
    private String cleanJsonResponse(String response) {
        String cleaned = response.trim();

        // Remove markdown code block wrappers
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

    /**
     * Parse subtasks from JSON response.
     *
     * FRAGILE: Assumes JSON is an array. Claude has been prompted to always
     * return an array, but this could break if the prompt changes.
     */
    private List<SubtaskSuggestion> parseSubtasks(JsonNode json) {
        List<SubtaskSuggestion> subtasks = new ArrayList<>();

        if (!json.isArray()) {
            log.warn("Expected JSON array but got: {}", json.getNodeType());
            // Try to extract 'subtasks' key if it exists
            if (json.has("subtasks") && json.get("subtasks").isArray()) {
                json = json.get("subtasks");
            } else {
                throw new IllegalArgumentException("Claude returned invalid format (not an array)");
            }
        }

        for (JsonNode node : json) {
            SubtaskSuggestion subtask = new SubtaskSuggestion();
            subtask.setTitle(node.get("title").asText());
            subtask.setDescription(node.has("description")
                    ? node.get("description").asText()
                    : null);
            subtask.setEstimatedMinutes(node.has("estimatedMinutes")
                    ? node.get("estimatedMinutes").asInt()
                    : 30);
            subtask.setPriority(node.has("priority")
                    ? node.get("priority").asText()
                    : "MEDIUM");

            subtasks.add(subtask);
        }

        return subtasks;
    }
}
