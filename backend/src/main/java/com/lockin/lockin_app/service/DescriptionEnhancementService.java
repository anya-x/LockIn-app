package com.lockin.lockin_app.service;

import com.lockin.lockin_app.dto.ClaudeResponseDTO;
import com.lockin.lockin_app.entity.AIUsage;
import com.lockin.lockin_app.entity.User;
import com.lockin.lockin_app.repository.AIUsageRepository;
import com.lockin.lockin_app.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

/**
 * Service for enhancing task descriptions using AI.
 *
 * Takes vague or minimal descriptions and expands them
 * into clear, actionable descriptions.
 *
 * BUG: No validation for empty input!
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class DescriptionEnhancementService {

    private final ClaudeAPIClientService claudeAPIClientService;
    private final AIUsageRepository aiUsageRepository;
    private final UserRepository userRepository;

    /**
     * Enhance a task description using AI.
     *
     * @param title Task title for context
     * @param description Original description (can be vague or empty)
     * @param userId User ID for usage tracking
     * @return Enhanced description
     */
    public EnhancementResult enhanceDescription(String title, String description, Long userId) {
        log.info("Enhancing description for task: {} (user: {})", title, userId);

        // Validation
        if (title == null || title.trim().isEmpty()) {
            throw new IllegalArgumentException("Task title cannot be empty");
        }

        if (description == null || description.trim().isEmpty()) {
            throw new IllegalArgumentException("Description cannot be empty. Please provide at least a brief description to enhance.");
        }

        if (description.trim().length() < 3) {
            throw new IllegalArgumentException("Description is too short. Please provide at least 3 characters.");
        }

        String systemPrompt = """
            You are a productivity assistant that improves task descriptions.
            Given a task title and a vague or minimal description, expand it into
            a clear, actionable description that helps the user understand what needs to be done.

            Keep it concise (2-4 sentences) but specific.
            Include relevant details about what, why, and how.
            """;

        String userPrompt = String.format(
                """
                Task Title: "%s"
                Current Description: "%s"

                Improve this description to be clear and actionable.
                If the current description is empty or very vague, make reasonable assumptions
                based on the title and create a helpful description.

                Return ONLY the improved description text, no other commentary.
                """,
                title,
                description != null ? description : ""
        );

        try {
            ClaudeResponseDTO response = claudeAPIClientService.sendMessage(systemPrompt, userPrompt);
            String enhancedDescription = response.getText().trim();

            // Track usage
            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new RuntimeException("User not found"));

            AIUsage usage = new AIUsage();
            usage.setUser(user);
            usage.setFeatureType("ENHANCE");
            usage.setTokensUsed(response.getTotalTokens());
            usage.setCostUSD(response.getEstimatedCost());
            usage.setRequestDetails(String.format("{\"title\":\"%s\"}", title.replace("\"", "\\\"")));

            aiUsageRepository.save(usage);

            log.info("Description enhanced: {} tokens, ${} cost",
                    response.getTotalTokens(),
                    String.format("%.4f", response.getEstimatedCost()));

            return new EnhancementResult(
                    enhancedDescription,
                    response.getTotalTokens(),
                    response.getEstimatedCost()
            );

        } catch (Exception e) {
            log.error("Description enhancement failed: {}", e.getMessage());
            throw new RuntimeException("AI description enhancement failed: " + e.getMessage(), e);
        }
    }

    /**
     * Result of description enhancement.
     */
    public record EnhancementResult(
            String enhancedDescription,
            int tokensUsed,
            double costUSD
    ) {}
}
