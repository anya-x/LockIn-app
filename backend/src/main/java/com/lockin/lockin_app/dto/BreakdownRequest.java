package com.lockin.lockin_app.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * Request DTO for task breakdown.
 */
@Data
public class BreakdownRequest {

    @NotBlank(message = "Task title is required")
    @Size(min = 3, max = 200, message = "Title must be 3-200 characters")
    private String title;

    @Size(max = 2000, message = "Description max 2000 characters")
    private String description;
}
