package com.lockin.lockin_app.dto;

import lombok.Data;

/**
 * DTO for a single subtask from the breakdown.
 */
@Data
public class SubtaskDTO {
    private String title;
    private String description;
    private Integer estimatedMinutes;
    private String priority;
}
