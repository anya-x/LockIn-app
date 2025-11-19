package com.lockin.lockin_app.features.ai.service;

import com.lockin.lockin_app.features.ai.dto.ClaudeResponseDTO;
import com.lockin.lockin_app.features.ai.dto.EnhancementResultDTO;
import com.lockin.lockin_app.features.ai.entity.AIUsage;
import com.lockin.lockin_app.features.users.entity.User;
import com.lockin.lockin_app.features.ai.repository.AIUsageRepository;
import com.lockin.lockin_app.features.users.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;


@Slf4j
@Service
@RequiredArgsConstructor
public class DescriptionEnhancementService {

    private final ClaudeAPIClientService claudeAPIClientService;
    private final AIUsageRepository aiUsageRepository;
    private final UserRepository userRepository;
    private final RateLimitService rateLimitService;

    @Cacheable(value = "enhancedDescriptions", key = "#title + '_' + (#description != null ? #description : '')")
    public EnhancementResultDTO enhanceDescription(String title, String description, Long userId) {
        log.info("Enhancing description for task: {} (user: {})", title, userId);

        rateLimitService.checkRateLimit(userId);

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

            return new EnhancementResultDTO(
                    enhancedDescription,
                    response.getTotalTokens(),
                    response.getEstimatedCost()
            );

        } catch (Exception e) {
            log.error("Description enhancement failed: {}", e.getMessage());
            throw new RuntimeException("AI description enhancement failed: " + e.getMessage(), e);
        }
    }
}