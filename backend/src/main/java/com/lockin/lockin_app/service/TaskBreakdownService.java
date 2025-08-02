package com.lockin.lockin_app.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.lockin.lockin_app.dto.ClaudeResponseDTO;
import com.lockin.lockin_app.dto.SubtaskSuggestionDTO;
import com.lockin.lockin_app.dto.TaskBreakdownResultDTO;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class TaskBreakdownService {

    private final ClaudeAPIClientService claudeAPIClientService;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public TaskBreakdownResultDTO breakdownTask(String title, String description) {
        log.info("Breaking down task: {}", title);

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

        String userPrompt = String.format(
                "Break down this task:\n\nTitle: %s\n\nDescription: %s\n\nProvide the breakdown as JSON.",
                title,
                description != null && !description.trim().isEmpty()
                        ? description
                        : "No additional context provided"
        );

        try {
            ClaudeResponseDTO response = claudeAPIClientService.sendMessage(systemPrompt, userPrompt);

            String jsonText = response.getText().trim();

            if (jsonText.startsWith("```json")) {
                jsonText = jsonText.substring(7);
            }
            if (jsonText.startsWith("```")) {
                jsonText = jsonText.substring(3); 
            }
            if (jsonText.endsWith("```")) {
                jsonText = jsonText.substring(0, jsonText.length() - 3);
            }
            jsonText = jsonText.trim();
            
            List<SubtaskSuggestionDTO> subtasks = objectMapper.readValue(
                    jsonText,
                    new TypeReference<List<SubtaskSuggestionDTO>>() {}
            );

            return new TaskBreakdownResultDTO(
                    subtasks,
                    response.getEstimatedCost(),
                    response.getTotalTokens()
            );

        } catch (Exception e) {
            throw new RuntimeException("Failed to break down task: " + e.getMessage(), e);
        }
    }
}