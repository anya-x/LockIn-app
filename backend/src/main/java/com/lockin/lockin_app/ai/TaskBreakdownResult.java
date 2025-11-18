package com.lockin.lockin_app.ai;

import com.lockin.lockin_app.entity.Task;
import lombok.Data;

import java.util.List;

/**
 * Result of AI task breakdown operation.
 *
 * Contains the original task, suggested subtasks, and API usage metrics.
 */
@Data
public class TaskBreakdownResult {

    /**
     * The original task that was broken down
     */
    private Task originalTask;

    /**
     * List of AI-generated subtask suggestions (typically 3-7 items)
     */
    private List<SubtaskSuggestion> subtasks;

    /**
     * Total tokens used (input + output)
     */
    private int tokensUsed;

    /**
     * Estimated cost in USD for this API call
     */
    private double costUSD;

    /**
     * Optional: AI's reasoning for how it broke down the task
     */
    private String reasoning;
}
