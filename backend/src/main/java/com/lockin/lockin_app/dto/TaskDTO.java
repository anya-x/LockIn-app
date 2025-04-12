package com.lockin.lockin_app.dto;

import com.lockin.lockin_app.entity.TaskStatus;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class TaskDTO {
    @NotBlank
    @Size(max = 255)
    private String title;

    @Size(max = 2000, message = "Description must be under 2000 characters")
    private String description;

    private TaskStatus status;

    private Boolean isUrgent;
    private Boolean isImportant;

    private LocalDateTime dueDate;
}
