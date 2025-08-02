package com.lockin.lockin_app.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import com.lockin.lockin_app.dto.ClaudeResponseDTO;
import com.lockin.lockin_app.dto.SubtaskSuggestionDTO;
import com.lockin.lockin_app.dto.TaskBreakdownResultDTO;
import com.lockin.lockin_app.entity.Task;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class TaskBreakdownService {

    private final ClaudeAPIClientService claudeAPIClientService;
    private final ObjectMapper objectMapper;

    public TaskBreakdownResultDTO breakdownTask(Task task) {
        log.info("Breaking down task: {}", task.getTitle());

        String systemPrompt = "You are a productivity assistant that helps break down tasks.";

        String userPrompt = String.format(
                "Break down this task into subtasks:\n\n" +
                        "Task: %s\n" +
                        "Description: %s\n\n" +
                        "Return 3-7 subtasks as a JSON array.",
                task.getTitle(),
                task.getDescription() != null ? task.getDescription() : "No description"
        );

        try {
            ClaudeResponseDTO response = claudeAPIClientService.sendMessage(systemPrompt, userPrompt);

            String jsonText = response.getText();

            JsonNode subtasks = objectMapper.readTree(jsonText);

            TaskBreakdownResultDTO result = new TaskBreakdownResultDTO();
            result.setOriginalTask(task);
            result.setSubtasks(parseSubtasks(subtasks));
            result.setTokensUsed(response.getTotalTokens());
            result.setCostUSD(response.getEstimatedCostUSD());

            log.info("Successfully broke down task into {} subtasks",
                     result.getSubtasks().size());

            return result;

        } catch (Exception e) {
            log.error("Failed to break down task: {}", e.getMessage());
            throw new RuntimeException("AI task breakdown failed: " + e.getMessage(), e);
        }
    }

    private List<SubtaskSuggestionDTO> parseSubtasks(JsonNode json) {
        List<SubtaskSuggestionDTO> subtasks = new ArrayList<>();

        if (json.isArray()) {
            for (JsonNode node : json) {
                SubtaskSuggestionDTO subtask = new SubtaskSuggestionDTO();
                subtask.setTitle(node.get("title").asText());
                subtask.setDescription(node.has("description") ?
                                               node.get("description").asText() : null);
                subtask.setEstimatedMinutes(node.has("estimatedMinutes") ?
                                                    node.get("estimatedMinutes").asInt() : 30);
                subtask.setPriority(node.has("priority") ?
                                            node.get("priority").asText() : "MEDIUM");

                subtasks.add(subtask);
            }
        }

        return subtasks;
    }
}