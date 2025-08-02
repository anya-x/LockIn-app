package com.lockin.lockin_app.dto;

import com.lockin.lockin_app.entity.Task;
import lombok.Data;

import java.util.List;

@Data
public class TaskBreakdownResultDTO {
    private Task originalTask;
    private List<SubtaskSuggestionDTO> subtasks;
    private int tokensUsed;
    private double costUSD;
    private String reasoning;
}
