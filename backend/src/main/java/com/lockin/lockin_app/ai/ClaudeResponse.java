package com.lockin.lockin_app.ai;

import lombok.AllArgsConstructor;
import lombok.Data;

/**
 * Represents a response from Claude API.
 */
@Data
@AllArgsConstructor
public class ClaudeResponse {

    /**
     * The actual text response from Claude
     */
    private String text;

    /**
     * Number of tokens in the input (affects cost)
     */
    private int inputTokens;

    /**
     * Number of tokens in the output (affects cost)
     */
    private int outputTokens;

    /**
     * Model that generated the response
     */
    private String model;

    /**
     * Calculate approximate cost in USD.
     *
     * Claude 3.5 Sonnet pricing (as of 2024):
     * - Input: $3 per million tokens
     * - Output: $15 per million tokens
     */
    public double getEstimatedCostUSD() {
        double inputCost = (inputTokens / 1_000_000.0) * 3.0;
        double outputCost = (outputTokens / 1_000_000.0) * 15.0;
        return inputCost + outputCost;
    }

    /**
     * Get total tokens used (input + output)
     */
    public int getTotalTokens() {
        return inputTokens + outputTokens;
    }
}
