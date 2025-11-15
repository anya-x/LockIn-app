package com.lockin.lockin_app.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.util.List;

/**
 * Result of task breakdown operation.
 */
@Data
@AllArgsConstructor
public class TaskBreakdownResult {
    private List<SubtaskDTO> subtasks;
    private double cost;
    private int totalTokens;
}
