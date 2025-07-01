package com.lockin.lockin_app.dto;

import com.lockin.lockin_app.entity.Goal;
import com.lockin.lockin_app.entity.Goal.GoalType;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Builder
@Data
public class GoalResponseDTO {
    private Long id;
    private String title;
    private String description;
    private GoalType type;

    private Integer targetTasks;
    private Integer targetPomodoros;
    private Integer targetFocusMinutes;

    private Integer currentTasks;
    private Integer currentPomodoros;
    private Integer currentFocusMinutes;

    private Double progressPercentage;
    private Boolean completed;
    private LocalDate completedDate;

    private LocalDate startDate;
    private LocalDate endDate;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static GoalResponseDTO fromEntity(Goal goal) {
        return GoalResponseDTO.builder()
                              .id(goal.getId())
                              .title(goal.getTitle())
                              .description(goal.getDescription())
                              .type(goal.getType())
                              .targetTasks(goal.getTargetTasks())
                              .targetPomodoros(goal.getTargetPomodoros())
                              .targetFocusMinutes(goal.getTargetFocusMinutes())
                              .currentTasks(goal.getCurrentTasks())
                              .currentPomodoros(goal.getCurrentPomodoros())
                              .currentFocusMinutes(goal.getCurrentFocusMinutes())
                              .progressPercentage(goal.getProgressPercentage())
                              .completed(goal.getCompleted())
                              .completedDate(goal.getCompletedDate())
                              .startDate(goal.getStartDate())
                              .endDate(goal.getEndDate())
                              .createdAt(goal.getCreatedAt())
                              .updatedAt(goal.getUpdatedAt())
                              .build();
    }
}