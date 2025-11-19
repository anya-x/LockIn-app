package com.lockin.lockin_app.features.tasks.dto;

import com.lockin.lockin_app.features.tasks.entity.Task;
import com.lockin.lockin_app.features.tasks.entity.TaskStatus;

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

    private Long categoryId;
    private String categoryName;
    private String categoryColor;

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

        if (task.getCategory() != null) {
            builder.categoryId(task.getCategory().getId())
                    .categoryName(task.getCategory().getName())
                    .categoryColor(task.getCategory().getColor());
        }

        return builder.build();
    }
}
