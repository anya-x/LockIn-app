package com.lockin.lockin_app.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * Request DTO for breaking down a task that hasn't been saved yet.
 *
 * Used by the /api/ai/breakdown-preview endpoint to get AI suggestions
 * before creating the actual task.
 */
@Data
public class TaskBreakdownRequest {

    /**
     * Title of the task to break down
     */
    @NotBlank(message = "Task title is required")
    @Size(max = 200, message = "Title must be under 200 characters")
    private String title;

    /**
     * Optional description providing more context
     */
    @Size(max = 2000, message = "Description must be under 2000 characters")
    private String description;
}
