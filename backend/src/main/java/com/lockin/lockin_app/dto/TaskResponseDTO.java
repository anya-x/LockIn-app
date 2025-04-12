package com.lockin.lockin_app.dto;

import com.lockin.lockin_app.entity.Task;
import com.lockin.lockin_app.entity.TaskStatus;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Builder
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

    public static TaskResponseDTO fromEntity(Task task) {
        TaskResponseDTOBuilder builder =
                TaskResponseDTO.builder()
                        .id(task.getId())
                        .title(task.getTitle())
                        .description(task.getDescription())
                        .isUrgent(task.getIsUrgent())
                        .isImportant(task.getIsImportant())
                        .status(task.getStatus())
                        .dueDate(task.getDueDate())
                        .createdAt(task.getCreatedAt())
                        .updatedAt(task.getUpdatedAt());
        return builder.build();
    }
}
