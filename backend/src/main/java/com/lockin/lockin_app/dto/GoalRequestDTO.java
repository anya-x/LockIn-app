package com.lockin.lockin_app.dto;

import com.lockin.lockin_app.entity.Goal.GoalType;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import lombok.Data;

import java.time.LocalDate;

@Data
public class GoalRequestDTO {

    @NotBlank(message = "Title is required")
    @Size(max = 200, message = "Title must be less than 200 characters")
    private String title;

    @Size(max = 1000, message = "Description must be less than 1000 characters")
    private String description;

    private GoalType type;

    private LocalDate startDate;
    private LocalDate endDate;

    @Min(value = 1, message = "Target tasks must be at least 1 if set")
    private Integer targetTasks;

    @Min(value = 1, message = "Target pomodoros must be at least 1 if set")
    private Integer targetPomodoros;

    @Min(value = 1, message = "Target focus minutes must be at least 1 if set")
    private Integer targetFocusMinutes;

    // for updates only
    @Min(value = 0, message = "Current tasks cannot be negative")
    private Integer currentTasks;

    @Min(value = 0, message = "Current pomodoros cannot be negative")
    private Integer currentPomodoros;

    @Min(value = 0, message = "Current focus minutes cannot be negative")
    private Integer currentFocusMinutes;

    public boolean hasAtLeastOneTarget() {
        return (targetTasks != null && targetTasks > 0) ||
                (targetPomodoros != null && targetPomodoros > 0) ||
                (targetFocusMinutes != null && targetFocusMinutes > 0);
    }
}