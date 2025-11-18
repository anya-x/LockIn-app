package com.lockin.lockin_app.dto;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.lockin.lockin_app.entity.Task;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Result of AI task breakdown containing suggested subtasks and metadata.
 */
@Data
@AllArgsConstructor
@NoArgsConstructor
public class TaskBreakdownResultDTO {

    /**
     * Original task entity (not serialized to avoid Hibernate lazy loading issues).
     * Used internally for reference but excluded from JSON response.
     */
    @JsonIgnore
    private Task originalTask;

    private List<SubtaskSuggestionDTO> subtasks;
    private int tokensUsed;
    private double costUSD;
    private String reasoning; // Why AI broke it down this way
}
