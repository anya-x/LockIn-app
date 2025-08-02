package com.lockin.lockin_app.dto;

import lombok.AllArgsConstructor;
import lombok.Data;


@Data
@AllArgsConstructor
public class ClaudeResponseDTO {
    private String text;
    private int inputTokens;
    private int outputTokens;
    private String model;

    public double getEstimatedCost() {
        double inputCost = (inputTokens / 1_000_000.0) * 3.0;
        double outputCost = (outputTokens / 1_000_000.0) * 15.0;
        return inputCost + outputCost;
    }

    public int getTotalTokens() {
        return inputTokens + outputTokens;
    }

}
