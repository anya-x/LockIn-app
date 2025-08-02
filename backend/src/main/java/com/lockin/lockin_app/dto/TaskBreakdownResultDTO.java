package com.lockin.lockin_app.dto;

import com.lockin.lockin_app.entity.Task;
import lombok.AllArgsConstructor;
import lombok.Data;

import java.util.List;
@Data
@AllArgsConstructor
public class TaskBreakdownResultDTO {
    private List<SubtaskSuggestionDTO> subtasks;
    private double cost;
    private int totalTokens;
}
