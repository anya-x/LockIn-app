package com.lockin.lockin_app.dto;

import lombok.Data;

@Data
public class GoalTemplateDTO {
    private String name;
    private String description;
    private String type; // DAILY, WEEKLY, MONTHLY
    private Integer targetTasks;
    private Integer targetPomodoros;
    private Integer targetFocusMinutes;
}
