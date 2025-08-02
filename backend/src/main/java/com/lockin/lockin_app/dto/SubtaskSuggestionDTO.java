package com.lockin.lockin_app.dto;

import lombok.Data;

@Data
public class SubtaskSuggestionDTO {
    private String title;
    private String description;
    private Integer estimatedMinutes;
    private String priority;
}