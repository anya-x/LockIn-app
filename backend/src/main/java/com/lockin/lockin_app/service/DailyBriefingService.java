package com.lockin.lockin_app.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.lockin.lockin_app.dto.BriefingResultDTO;
import com.lockin.lockin_app.dto.ClaudeResponseDTO;
import com.lockin.lockin_app.entity.AIUsage;
import com.lockin.lockin_app.entity.Task;
import com.lockin.lockin_app.entity.TaskStatus;
import com.lockin.lockin_app.entity.User;
import com.lockin.lockin_app.repository.AIUsageRepository;
import com.lockin.lockin_app.repository.TaskRepository;
import com.lockin.lockin_app.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class DailyBriefingService {

    private final ClaudeAPIClientService claudeAPIClientService;
    private final TaskRepository taskRepository;
    private final AIUsageRepository aiUsageRepository;
    private final UserRepository userRepository;
    private final ObjectMapper objectMapper;


    public BriefingResultDTO generateDailyBriefing(Long userId) {
        log.info("Generating daily briefing for user: {}", userId);

        User user = userRepository.findById(userId)
                                  .orElseThrow(() -> new RuntimeException("User not found"));

        // Check for cached briefing from today
        LocalDateTime startOfDay = LocalDateTime.of(LocalDate.now(), LocalTime.MIN);
        AIUsage cachedBriefing = aiUsageRepository.findTodaysBriefing(user, "BRIEFING", startOfDay);

        if (cachedBriefing != null && cachedBriefing.getResponseDetails() != null) {
            log.info("Returning cached briefing for user: {}", userId);
            try {
                BriefingResultDTO cached = objectMapper.readValue(
                        cachedBriefing.getResponseDetails(),
                        BriefingResultDTO.class
                );
                log.info("Cache hit! Saved API call for daily briefing");
                return cached;
            } catch (JsonProcessingException e) {
                log.warn("Failed to parse cached briefing, regenerating: {}", e.getMessage());
            }
        }

        log.info("No cached briefing found, generating new one for user: {}", userId);

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

            // Cache the result
            AIUsage usage = new AIUsage();
            usage.setUser(user);
            usage.setFeatureType("BRIEFING");
            usage.setTokensUsed(response.getTotalTokens());
            usage.setCostUSD(response.getEstimatedCost());
            usage.setRequestDetails(String.format("{\"taskCount\":%d}", totalActiveTasks));

            try {
                String cachedResponse = objectMapper.writeValueAsString(result);
                usage.setResponseDetails(cachedResponse);
            } catch (JsonProcessingException e) {
                log.warn("Failed to cache briefing result: {}", e.getMessage());
            }

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