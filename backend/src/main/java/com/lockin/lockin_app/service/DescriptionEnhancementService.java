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
            You are a productivity assistant that helps clarify vague task descriptions.

            CRITICAL RULES:
            1. DO NOT add features or requirements the user didn't mention
            2. DO NOT suggest implementation details unless asked
            3. ONLY clarify what was already implied
            4. Keep enhancements minimal and focused

            Your job is to:
            - Fix grammar and typos
            - Add 1-2 clarifying sentences if description is very vague
            - Make implicit information explicit
            - That's it!

            If the description is already clear, return it unchanged or with minor edits.

            Respond with ONLY the enhanced description text.
            """;

        String userPrompt = String.format(
            "Task Title: \"%s\"\n\n" +
            "Description: \"%s\"\n\n" +
            "Enhance MINIMALLY - only clarify if vague, don't add new features.",
            title,
            originalDescription != null && !originalDescription.isEmpty()
                ? originalDescription
                : "[User provided no description - suggest adding one]"
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
