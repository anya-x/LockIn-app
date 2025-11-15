package com.lockin.lockin_app.service;

import com.lockin.lockin_app.ai.ClaudeAPIClient;
import com.lockin.lockin_app.ai.ClaudeResponse;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

/**
 * Service for enhancing task descriptions using AI.
 *
 * Takes a brief/vague description and expands it with:
 * - More context
 * - Clearer action steps
 * - Success criteria
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class DescriptionEnhancementService {

    private final ClaudeAPIClient claudeAPIClient;
    private final AICache aiCache;

    public EnhancementResult enhance(String title, String originalDescription) {
        // Create cache key
        String cacheKey = "enhance:" + title + ":" +
            (originalDescription != null ? originalDescription.hashCode() : "");

        // Check cache
        EnhancementResult cached = aiCache.get(cacheKey, EnhancementResult.class);
        if (cached != null) {
            log.info("Returning cached enhancement");
            return cached;
        }

        // Build prompt
        String systemPrompt = """
            You are a productivity assistant that helps clarify and enhance task descriptions.

            Your goal is to:
            1. Add context and clarity
            2. Break down what needs to be done
            3. Suggest success criteria
            4. Keep the original intent intact

            IMPORTANT: DO NOT change the fundamental goal of the task!
            Only add helpful details and structure.

            Respond with ONLY the enhanced description text, no other commentary.
            """;

        String userPrompt = String.format(
            "Task Title: \"%s\"\n\n" +
            "Original Description: \"%s\"\n\n" +
            "Enhance this description to make it clearer and more actionable, " +
            "but don't change the core intent.",
            title,
            originalDescription != null && !originalDescription.isEmpty()
                ? originalDescription
                : "[No description provided]"
        );

        ClaudeResponse response = claudeAPIClient.sendMessage(systemPrompt, userPrompt);

        EnhancementResult result = new EnhancementResult(
            originalDescription,
            response.getText().trim(),
            response.getTotalTokens(),
            response.getEstimatedCostUSD()
        );

        // Cache it
        aiCache.put(cacheKey, result);

        return result;
    }

    @Data
    @AllArgsConstructor
    public static class EnhancementResult {
        private String originalDescription;
        private String enhancedDescription;
        private int tokensUsed;
        private double costUSD;
    }
}
