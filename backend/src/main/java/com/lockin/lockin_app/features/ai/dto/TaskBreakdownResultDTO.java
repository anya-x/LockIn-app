package com.lockin.lockin_app.features.ai.dto;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.lockin.lockin_app.features.tasks.entity.Task;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class TaskBreakdownResultDTO {
    @JsonIgnore
    private Task originalTask;
    private List<SubtaskSuggestionDTO> subtasks;
    private int tokensUsed;
    private double costUSD;
    private String reasoning;
}