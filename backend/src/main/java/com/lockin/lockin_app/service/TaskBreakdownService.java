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

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
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
                task.getDueDate(),
                task.getUser().getId()
        );
        result.setOriginalTask(task);

        return result;
    }
    
    @Cacheable(value = "taskBreakdowns", key = "#title + '_' + (#description != null ? #description : '')")
    public TaskBreakdownResultDTO breakdownTask(String title, String description, LocalDateTime dueDate, Long userId) {
        log.info("Breaking down task: {} (due: {}) for user: {} (cache miss)", title, dueDate, userId);

        // Check rate limit INSIDE @Cacheable method
        // This way, cache hits don't count against the limit
        rateLimitService.checkRateLimit(userId);

        if (title == null || title.trim().isEmpty()) {
            throw new IllegalArgumentException("Task title cannot be empty");
        }

        // Calculate urgency context from deadline
        String deadlineContext = formatDeadlineContext(dueDate);

        String systemPrompt = """
            You are a productivity assistant that breaks down tasks into actionable subtasks.
            You MUST always respond with valid JSON object, even for vague tasks.
            If the task is vague, make reasonable assumptions and create general subtasks.

            Your response must include:
            1. A brief reasoning explaining your breakdown approach
            2. An array of 3-7 actionable subtasks classified using the Eisenhower Matrix
            """;

        String userPrompt = String.format(
                """
                Break down this task into 3-7 actionable subtasks using the Eisenhower Matrix.

                Task Title: "%s"
                Description: "%s"
                Deadline: %s

                RULES:
                1. ALWAYS return valid JSON object (no other text)
                2. If task is vague, make reasonable assumptions
                3. Each subtask must start with action verb
                4. Estimate realistic time (15-90 minutes per subtask)
                5. Classify using Eisenhower Matrix - consider BOTH deadline AND task nature:

                   isUrgent: true if ANY of these apply:
                   • Time-sensitive by nature (bug fixes, critical issues, blocking others)
                   • Deadline approaching (due within 1-2 days)
                   • Has consequences if delayed (production issues, dependencies)

                   isImportant: true if ANY of these apply:
                   • Contributes to goals/objectives (strategic, high-value)
                   • Core work vs busywork (meaningful impact)
                   • Aligns with project priorities

                6. URGENCY EXAMPLES by task type (deadline is just ONE factor):

                   CONTENT-DRIVEN urgency (urgent regardless of deadline):
                   • "Fix production bug" → URGENT (blocks users)
                   • "Review PR blocking deployment" → URGENT (blocks others)
                   • "Respond to client emergency" → URGENT (external dependency)

                   DEADLINE-DRIVEN urgency (depends on timeline):
                   • "Organize photos" due tomorrow → NOT urgent (can reschedule)
                   • "Submit tax return" due tomorrow → URGENT (penalty if late)
                   • "Prepare presentation" due in 2 hours → URGENT (imminent)

                   NEITHER urgent (even with deadline):
                   • "Clean downloads folder" → Never urgent
                   • "Read optional article" → Never urgent

                   Eisenhower Quadrants:
                   • Urgent + Important (Do First): Critical deadlines, crises, blocking work
                   • Important only (Schedule): Planning, learning, strategic work
                   • Urgent only (Delegate): Interruptions, some emails
                   • Neither (Eliminate): Busywork, time-wasters

                JSON Format (respond with ONLY this, no other text):
                {
                  "reasoning": "Brief explanation of your breakdown approach",
                  "subtasks": [
                    {
                      "title": "Action verb + specific task",
                      "description": "What and how to do it",
                      "estimatedMinutes": 30,
                      "isUrgent": false,
                      "isImportant": true
                    }
                  ]
                }

                CRITICAL: Return ONLY the JSON object, absolutely no other text.
                """,
                title,
                description != null && !description.trim().isEmpty()
                        ? description
                        : "No additional details provided",
                deadlineContext
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

            // Save AIUsage for tracking (only on cache miss)
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

    /**
     * Formats deadline information into human-readable context for AI urgency classification.
     * Provides factual deadline information without prescribing urgency - the AI should
     * consider both deadline AND task nature when determining urgency.
     *
     * @param dueDate The task's due date, or null if no deadline
     * @return Human-readable deadline context for AI prompt
     */
    private String formatDeadlineContext(LocalDateTime dueDate) {
        if (dueDate == null) {
            return "No deadline set";
        }

        LocalDateTime now = LocalDateTime.now();
        long hoursUntilDue = ChronoUnit.HOURS.between(now, dueDate);
        long daysUntilDue = ChronoUnit.DAYS.between(now, dueDate);

        if (hoursUntilDue < 0) {
            return "OVERDUE by " + Math.abs(daysUntilDue) + " days";
        } else if (hoursUntilDue < 6) {
            return "Due in " + hoursUntilDue + " hours (imminent)";
        } else if (hoursUntilDue < 24) {
            return "Due in " + hoursUntilDue + " hours (today)";
        } else if (daysUntilDue == 1) {
            return "Due tomorrow (" + hoursUntilDue + " hours)";
        } else if (daysUntilDue < 7) {
            return "Due in " + daysUntilDue + " days (this week)";
        } else if (daysUntilDue < 14) {
            return "Due in " + daysUntilDue + " days (next week)";
        } else {
            return "Due in " + daysUntilDue + " days (" + (daysUntilDue / 7) + " weeks out)";
        }
    }
}