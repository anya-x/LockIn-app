package com.lockin.lockin_app.service;

import com.lockin.lockin_app.ai.ClaudeAPIClient;
import com.lockin.lockin_app.ai.ClaudeResponse;
import com.lockin.lockin_app.entity.Task;
import com.lockin.lockin_app.entity.User;
import com.lockin.lockin_app.repository.TaskRepository;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Service for generating daily AI briefings.
 *
 * WIP: Basic implementation
 * TODO: Add more context (focus sessions, patterns, etc.)
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class DailyBriefingService {

    private final ClaudeAPIClient claudeAPIClient;
    private final TaskRepository taskRepository;
    private final AICache aiCache;

    public BriefingResult generateBriefing(User user) {
        // Cache key includes date so it regenerates daily
        String cacheKey = "briefing:" + user.getId() + ":" +
            LocalDate.now().toString();

        // Check cache
        BriefingResult cached = aiCache.get(cacheKey, BriefingResult.class);
        if (cached != null) {
            log.info("Returning cached briefing");
            return cached;
        }

        // Get user's tasks for today
        List<Task> todayTasks = getTasksDueToday(user.getId());

        if (todayTasks.isEmpty()) {
            return new BriefingResult(
                "You have no tasks due today! 🎉 Time to plan ahead or take a well-deserved break.",
                List.of(),
                0,
                0.0
            );
        }

        // Build prompt with task context
        String systemPrompt = """
            You are a supportive productivity coach providing a daily briefing.

            Analyze the user's tasks and provide:
            1. Brief overview (2-3 sentences)
            2. Top priority recommendation
            3. One motivational insight or tip

            Keep it concise, positive, and actionable.
            """;

        // WIP: This doesn't include enough context!
        // TODO: Add focus session history, completion patterns, etc.
        String taskList = todayTasks.stream()
            .map(t -> String.format("- %s [%s]",
                t.getTitle(),
                t.getStatus()))
            .collect(Collectors.joining("\n"));

        String userPrompt = String.format(
            "Here are the user's %d tasks for today:\n\n%s\n\n" +
            "Provide a brief, motivational daily briefing.",
            todayTasks.size(),
            taskList
        );

        ClaudeResponse response = claudeAPIClient.sendMessage(systemPrompt, userPrompt);

        BriefingResult result = new BriefingResult(
            response.getText(),
            todayTasks,
            response.getTotalTokens(),
            response.getEstimatedCostUSD()
        );

        // Cache for the day
        aiCache.put(cacheKey, result);

        return result;
    }

    private List<Task> getTasksDueToday(Long userId) {
        LocalDate today = LocalDate.now();
        LocalDateTime startOfDay = today.atStartOfDay();
        LocalDateTime endOfDay = today.plusDays(1).atStartOfDay();

        List<Task> allTasks = taskRepository.findByUserId(userId);

        return allTasks.stream()
            .filter(task -> task.getDueDate() != null &&
                !task.getDueDate().isBefore(startOfDay) &&
                task.getDueDate().isBefore(endOfDay))
            .collect(Collectors.toList());
    }

    @Data
    @AllArgsConstructor
    public static class BriefingResult {
        private String briefingText;
        private List<Task> todayTasks;
        private int tokensUsed;
        private double costUSD;
    }
}
