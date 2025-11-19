package com.lockin.lockin_app.dto;

import lombok.Data;

/**
 * DTO for AI-generated subtask suggestions.
 * Uses Eisenhower Matrix classification (urgent/important) instead of priority levels.
 */
@Data
public class SubtaskSuggestionDTO {
    private String title;
    private String description;
    private Integer estimatedMinutes;

    /**
     * Eisenhower Matrix: Is this task time-sensitive?
     * Urgent tasks require immediate attention.
     */
    private Boolean isUrgent;

    /**
     * Eisenhower Matrix: Does this task align with goals/values?
     * Important tasks contribute to long-term objectives.
     */
    private Boolean isImportant;
}