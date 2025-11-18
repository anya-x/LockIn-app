package com.lockin.lockin_app.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.lockin.lockin_app.dto.ClaudeResponseDTO;
import com.lockin.lockin_app.entity.AIUsage;
import com.lockin.lockin_app.entity.Task;
import com.lockin.lockin_app.entity.User;
import com.lockin.lockin_app.repository.AIUsageRepository;
import com.lockin.lockin_app.repository.TaskRepository;
import com.lockin.lockin_app.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Service for generating daily task briefings using AI.
 *
 * Summarizes user's tasks for the day, grouped by Eisenhower Matrix quadrants.
 * Provides AI-powered insights and priority suggestions.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class DailyBriefingService {

    private final ClaudeAPIClientService claudeAPIClientService;
    private final TaskRepository taskRepository;
    private final AIUsageRepository aiUsageRepository;
    private final UserRepository userRepository;
    private final ObjectMapper objectMapper = new ObjectMapper();

    /**
     * Generate a daily briefing for the user's tasks.
     *
     * CACHEABLE: Results cached for 24 hours (expires daily at midnight).
     * Cache key: userId + current date (ensures one briefing per day per user)
     *
     * @param userId User ID
     * @return Briefing result with summary and priorities
     */
    @Cacheable(value = "dailyBriefings", key = "#userId + ':' + T(java.time.LocalDate).now().toString()")
    public BriefingResult generateDailyBriefing(Long userId) {
        log.info("Generating daily briefing for user: {}", userId);

        // Get user for tracking
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Get all active tasks for the user
        List<Task> tasks = taskRepository.findByUserId(userId);
        List<Task> activeTasks = tasks.stream()
                .filter(task -> !"COMPLETED".equals(task.getStatus()))
                .toList();

        if (activeTasks.isEmpty()) {
            return new BriefingResult(
                    "You have no active tasks. Great job staying on top of things!",
                    0, 0, 0, 0,
                    List.of(),
                    0, 0.0
            );
        }

        // Group by Eisenhower Matrix quadrants
        List<Task> q1Urgent Important = activeTasks.stream()
                .filter(t -> t.isUrgent() && t.isImportant())
                .toList();

        List<Task> q2ImportantNotUrgent = activeTasks.stream()
                .filter(t -> !t.isUrgent() && t.isImportant())
                .toList();

        List<Task> q3UrgentNotImportant = activeTasks.stream()
                .filter(t -> t.isUrgent() && !t.isImportant())
                .toList();

        List<Task> q4NeitherUrgentNorImportant = activeTasks.stream()
                .filter(t -> !t.isUrgent() && !t.isImportant())
                .toList();

        // Build task summary for AI
        String taskSummary = buildTaskSummary(
                q1UrgentImportant,
                q2ImportantNotUrgent,
                q3UrgentNotImportant,
                q4NeitherUrgentNorImportant
        );

        // Generate AI summary
        String systemPrompt = """
            You are a productivity coach providing a daily task briefing.
            Analyze the user's tasks and provide:
            1. A brief motivational summary (2-3 sentences)
            2. Top 3 priority recommendations for today
            3. Time management insight

            Be encouraging but realistic. Keep it concise and actionable.
            """;

        String userPrompt = String.format(
                """
                Here are my tasks for today, grouped by priority:

                %s

                Provide a brief daily briefing with:
                1. Motivational summary (2-3 sentences)
                2. Top 3 tasks I should focus on today
                3. One time management tip

                Keep it concise and actionable. Format as plain text.
                """,
                taskSummary
        );

        try {
            ClaudeResponseDTO response = claudeAPIClientService.sendMessage(systemPrompt, userPrompt);
            String briefing = response.getText().trim();

            // Extract top priorities (first 3 urgent+important tasks)
            List<String> topPriorities = q1UrgentImportant.stream()
                    .limit(3)
                    .map(Task::getTitle)
                    .toList();

            // If less than 3 in Q1, add from Q2
            if (topPriorities.size() < 3) {
                List<String> additional = q2ImportantNotUrgent.stream()
                        .limit(3 - topPriorities.size())
                        .map(Task::getTitle)
                        .toList();

                topPriorities = new java.util.ArrayList<>(topPriorities);
                topPriorities.addAll(additional);
            }

            // Create result
            BriefingResult result = new BriefingResult(
                    briefing,
                    q1UrgentImportant.size(),
                    q2ImportantNotUrgent.size(),
                    q3UrgentNotImportant.size(),
                    q4NeitherUrgentNorImportant.size(),
                    topPriorities,
                    response.getTotalTokens(),
                    response.getEstimatedCost()
            );

            // Track usage (caching handled by @Cacheable annotation)
            AIUsage usage = new AIUsage();
            usage.setUser(user);
            usage.setFeatureType("BRIEFING");
            usage.setTokensUsed(response.getTotalTokens());
            usage.setCostUSD(response.getEstimatedCost());
            usage.setRequestDetails(String.format("{\"taskCount\":%d}", activeTasks.size()));

            aiUsageRepository.save(usage);

            log.info("Daily briefing generated: {} tasks, {} tokens, ${} cost",
                    activeTasks.size(),
                    response.getTotalTokens(),
                    String.format("%.4f", response.getEstimatedCost()));

            return result;

        } catch (Exception e) {
            log.error("Daily briefing generation failed: {}", e.getMessage());
            throw new RuntimeException("AI daily briefing failed: " + e.getMessage(), e);
        }
    }

    /**
     * Build a text summary of tasks grouped by quadrant.
     */
    private String buildTaskSummary(
            List<Task> q1, List<Task> q2, List<Task> q3, List<Task> q4) {

        StringBuilder summary = new StringBuilder();

        if (!q1.isEmpty()) {
            summary.append("URGENT & IMPORTANT (Do First):\n");
            q1.forEach(t -> summary.append("- ").append(t.getTitle() != null ? t.getTitle() : "Untitled").append("\n"));
            summary.append("\n");
        }

        if (!q2.isEmpty()) {
            summary.append("IMPORTANT (Schedule):\n");
            q2.forEach(t -> summary.append("- ").append(t.getTitle() != null ? t.getTitle() : "Untitled").append("\n"));
            summary.append("\n");
        }

        if (!q3.isEmpty()) {
            summary.append("URGENT (Delegate if possible):\n");
            q3.forEach(t -> summary.append("- ").append(t.getTitle() != null ? t.getTitle() : "Untitled").append("\n"));
            summary.append("\n");
        }

        if (!q4.isEmpty()) {
            summary.append("OTHER:\n");
            q4.forEach(t -> summary.append("- ").append(t.getTitle() != null ? t.getTitle() : "Untitled").append("\n"));
        }

        return summary.toString();
    }

    /**
     * Result of daily briefing generation.
     */
    public record BriefingResult(
            String summary,
            int urgentImportantCount,
            int importantCount,
            int urgentCount,
            int otherCount,
            List<String> topPriorities,
            int tokensUsed,
            double costUSD
    ) {}
}
