package com.lockin.lockin_app.dto;

import com.lockin.lockin_app.entity.TaskStatus;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class TaskResponseDTO {
    private Long id;
    private String title;
    private String description;
    private TaskStatus status;
    private Boolean isUrgent;
    private Boolean isImportant;
    private LocalDateTime dueDate;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
