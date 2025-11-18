package com.lockin.lockin_app.ai;

import lombok.Data;

/**
 * Represents a single AI-suggested subtask.
 *
 * Part of the TaskBreakdownResult returned by Claude AI.
 */
@Data
public class SubtaskSuggestion {

    /**
     * Title of the subtask (should start with action verb)
     */
    private String title;

    /**
     * Brief description of what needs to be done
     */
    private String description;

    /**
     * Estimated time to complete in minutes
     */
    private Integer estimatedMinutes;

    /**
     * Priority level: HIGH, MEDIUM, or LOW
     */
    private String priority;
}
