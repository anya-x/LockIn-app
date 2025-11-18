package com.lockin.lockin_app.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * Request DTO for breaking down a task that doesn't exist in the database yet.
 * Used for preview functionality before creating the task.
 */
@Data
public class TaskBreakdownRequestDTO {

    @NotBlank(message = "Title is required")
    @Size(max = 200, message = "Title cannot exceed 200 characters")
    private String title;

    @Size(max = 2000, message = "Description cannot exceed 2000 characters")
    private String description;
}
