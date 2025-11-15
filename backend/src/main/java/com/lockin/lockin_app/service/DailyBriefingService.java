package com.lockin.lockin_app.service;

import com.lockin.lockin_app.ai.ClaudeAPIClient;
import com.lockin.lockin_app.ai.ClaudeResponse;
import com.lockin.lockin_app.ai.PromptTemplates;
import com.lockin.lockin_app.entity.Task;
import com.lockin.lockin_app.entity.TaskStatus;
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
        if (user == null || user.getId() == null) {
            throw new IllegalArgumentException("User cannot be null");
        }

        // Cache key includes date so it regenerates daily
        String cacheKey = "briefing:" + user.getId() + ":" +
            LocalDate.now().toString();

        // Check cache
        BriefingResult cached = aiCache.get(cacheKey, BriefingResult.class);
        if (cached != null) {
            log.info("Returning cached briefing");
            return cached;
        }

        // Get richer context (with null safety)
        List<Task> todayTasks = getTasksDueToday(user.getId());
        List<Task> overdueTasks = getOverdueTasks(user.getId());

        // Ensure lists are never null
        if (todayTasks == null) todayTasks = List.of();
        if (overdueTasks == null) overdueTasks = List.of();

        // Get completion stats from last 7 days
        LocalDateTime weekAgo = LocalDateTime.now().minusDays(7);
        long completedLastWeek = countCompletedSince(user.getId(), weekAgo);
        long totalLastWeek = countCreatedSince(user.getId(), weekAgo);

        if (todayTasks.isEmpty()) {
            return new BriefingResult(
                "You have no tasks due today! 🎉 Time to plan ahead or take a well-deserved break.",
                List.of(),
                0,
                0.0
            );
        }

        // Use centralized prompt template
        String systemPrompt = PromptTemplates.DAILY_BRIEFING_SYSTEM;

        String taskList = todayTasks.stream()
            .limit(10) // Don't overwhelm Claude
            .map(t -> String.format("- %s [Priority: %s/%s, Status: %s]",
                t.getTitle(),
                t.getIsUrgent() ? "Urgent" : "Not Urgent",
                t.getIsImportant() ? "Important" : "Not Important",
                t.getStatus()))
            .collect(Collectors.joining("\n"));

        String contextInfo = String.format(
            "Context:\n" +
            "- Tasks due today: %d\n" +
            "- Overdue tasks: %d\n" +
            "- Completion rate last 7 days: %d/%d (%.0f%%)\n\n",
            todayTasks.size(),
            overdueTasks.size(),
            completedLastWeek,
            totalLastWeek,
            totalLastWeek > 0 ? (completedLastWeek * 100.0 / totalLastWeek) : 0
        );

        String userPrompt = contextInfo + "Today's tasks:\n" + taskList +
            "\n\nProvide a personalized daily briefing.";

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

    private List<Task> getOverdueTasks(Long userId) {
        LocalDateTime now = LocalDateTime.now();
        List<Task> allTasks = taskRepository.findByUserId(userId);

        return allTasks.stream()
            .filter(task -> task.getDueDate() != null &&
                task.getDueDate().isBefore(now) &&
                task.getStatus() != TaskStatus.COMPLETED)
            .collect(Collectors.toList());
    }

    private long countCompletedSince(Long userId, LocalDateTime since) {
        List<Task> allTasks = taskRepository.findByUserId(userId);

        return allTasks.stream()
            .filter(task -> task.getStatus() == TaskStatus.COMPLETED &&
                task.getUpdatedAt() != null &&
                !task.getUpdatedAt().isBefore(since))
            .count();
    }

    private long countCreatedSince(Long userId, LocalDateTime since) {
        List<Task> allTasks = taskRepository.findByUserId(userId);

        return allTasks.stream()
            .filter(task -> task.getCreatedAt() != null &&
                !task.getCreatedAt().isBefore(since))
            .count();
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
