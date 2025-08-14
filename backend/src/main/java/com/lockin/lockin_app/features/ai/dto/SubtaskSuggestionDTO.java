package com.lockin.lockin_app.features.ai.dto;

import lombok.Data;

@Data
public class SubtaskSuggestionDTO {
    private String title;
    private String description;
    private Integer estimatedMinutes;
    private String priority;

    private Boolean isUrgent;
    private Boolean isImportant;
}