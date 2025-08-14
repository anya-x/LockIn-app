package com.lockin.lockin_app.features.tasks.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TaskStatisticsDTO {
    private Long totalTasks;
    private Long todoCount;
    private Long inProgressCount;
    private Long completedCount;

    private Long urgentCount;
    private Long importantCount;
    private Long urgentAndImportantCount;

    private Double completionRate;

    private Map<String, Long> tasksByCategory;

    private Long tasksCreatedThisWeek;

    private Long tasksCompletedThisWeek;
}
