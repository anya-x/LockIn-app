package com.lockin.lockin_app.features.ai.service;

import com.lockin.lockin_app.features.ai.dto.BriefingResultDTO;
import com.lockin.lockin_app.features.ai.dto.ClaudeResponseDTO;
import com.lockin.lockin_app.features.ai.entity.AIUsage;
import com.lockin.lockin_app.features.tasks.entity.Task;
import com.lockin.lockin_app.features.tasks.entity.TaskStatus;
import com.lockin.lockin_app.features.users.entity.User;
import com.lockin.lockin_app.features.ai.repository.AIUsageRepository;
import com.lockin.lockin_app.features.tasks.repository.TaskRepository;
import com.lockin.lockin_app.features.users.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class DailyBriefingService {

    private final ClaudeAPIClientService claudeAPIClientService;
    private final TaskRepository taskRepository;
    private final AIUsageRepository aiUsageRepository;
    private final UserRepository userRepository;
    private final RateLimitService rateLimitService;

    @Cacheable(value = "dailyBriefings", key = "#userId + '_' + T(java.time.LocalDate).now()")
    public BriefingResultDTO generateDailyBriefing(Long userId) {
        log.info("Generating daily briefing for user: {}", userId);

        rateLimitService.checkRateLimit(userId);

        List<Task> q1UrgentImportant = taskRepository.findByQuadrantExcludingStatus(
                userId, true, true, TaskStatus.COMPLETED);
        List<Task> q2ImportantNotUrgent = taskRepository.findByQuadrantExcludingStatus(
                userId, false, true, TaskStatus.COMPLETED);
        List<Task> q3UrgentNotImportant = taskRepository.findByQuadrantExcludingStatus(
                userId, true, false, TaskStatus.COMPLETED);
        List<Task> q4NeitherUrgentNorImportant = taskRepository.findByQuadrantExcludingStatus(
                userId, false, false, TaskStatus.COMPLETED);

        int totalActiveTasks = q1UrgentImportant.size() + q2ImportantNotUrgent.size() +
                q3UrgentNotImportant.size() + q4NeitherUrgentNorImportant.size();

        if (totalActiveTasks == 0) {
            return new BriefingResultDTO(
                    "You have no active tasks. Great job staying on top of things!",
                    0, 0, 0, 0,
                    List.of(),
                    0, 0.0
            );
        }

        String taskSummary = buildTaskSummary(
                q1UrgentImportant,
                q2ImportantNotUrgent,
                q3UrgentNotImportant,
                q4NeitherUrgentNorImportant
        );

        String systemPrompt = """
            You are a warm, supportive productivity companion. Speak directly to the user in a personal, conversational tone.
            Keep your briefing short and genuine - like a friend checking in.
            Focus on what matters most TODAY.
            """;

        String userPrompt = String.format(
                """
                Good morning! Here's what I have on my plate today:

                %s

                Give me a quick daily briefing:
                - What's my focus for today? (Pick the top 3 things)
                - A short, genuine pep talk (1-2 sentences - keep it real)
                - One practical tip to tackle this list

                Keep it casual and concise. Write like you're talking to me, not reading from a script.
                """,
                taskSummary
        );

        try {
            ClaudeResponseDTO response = claudeAPIClientService.sendMessage(systemPrompt, userPrompt);
            String briefing = response.getText().trim();

            List<String> topPriorities = q1UrgentImportant.stream()
                                                          .limit(3)
                                                          .map(Task::getTitle)
                                                          .toList();

            if (topPriorities.size() < 3) {
                List<String> additional = q2ImportantNotUrgent.stream()
                                                              .limit(3 - topPriorities.size())
                                                              .map(Task::getTitle)
                                                              .toList();

                topPriorities = new java.util.ArrayList<>(topPriorities);
                topPriorities.addAll(additional);
            }

            BriefingResultDTO result = new BriefingResultDTO(
                    briefing,
                    q1UrgentImportant.size(),
                    q2ImportantNotUrgent.size(),
                    q3UrgentNotImportant.size(),
                    q4NeitherUrgentNorImportant.size(),
                    topPriorities,
                    response.getTotalTokens(),
                    response.getEstimatedCost()
            );

            User user = userRepository.findById(userId)
                                      .orElseThrow(() -> new RuntimeException("User not found"));

            AIUsage usage = new AIUsage();
            usage.setUser(user);
            usage.setFeatureType("BRIEFING");
            usage.setTokensUsed(response.getTotalTokens());
            usage.setCostUSD(response.getEstimatedCost());
            usage.setRequestDetails(String.format("{\"taskCount\":%d}", totalActiveTasks));

            aiUsageRepository.save(usage);

            log.info("Daily briefing generated and cached: {} tasks, {} tokens, ${} cost",
                     totalActiveTasks,
                     response.getTotalTokens(),
                     String.format("%.4f", response.getEstimatedCost()));

            return result;

        } catch (Exception e) {
            log.error("Daily briefing generation failed: {}", e.getMessage());
            throw new RuntimeException("AI daily briefing failed: " + e.getMessage(), e);
        }
    }

    private String buildTaskSummary(
            List<Task> q1, List<Task> q2, List<Task> q3, List<Task> q4) {

        StringBuilder summary = new StringBuilder();

        if (!q1.isEmpty()) {
            summary.append("URGENT & IMPORTANT (Do First):\n");
            q1.forEach(t -> summary.append("- ").append(t.getTitle()).append("\n"));
            summary.append("\n");
        }

        if (!q2.isEmpty()) {
            summary.append("IMPORTANT (Schedule):\n");
            q2.forEach(t -> summary.append("- ").append(t.getTitle()).append("\n"));
            summary.append("\n");
        }

        if (!q3.isEmpty()) {
            summary.append("URGENT (Delegate if possible):\n");
            q3.forEach(t -> summary.append("- ").append(t.getTitle()).append("\n"));
            summary.append("\n");
        }

        if (!q4.isEmpty()) {
            summary.append("OTHER:\n");
            q4.forEach(t -> summary.append("- ").append(t.getTitle()).append("\n"));
        }

        return summary.toString();
    }
}