package com.lockin.lockin_app.dto;

import com.lockin.lockin_app.entity.SessionType;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

import lombok.Data;

@Data
public class FocusSessionRequestDTO {

    @NotNull(message = "Planned minutes is required")
    @Min(value = 1, message = "Session must be at least 1 minute")
    private Integer plannedMinutes;

    @NotNull(message = "Session type is required")
    private SessionType sessionType;

    private Long taskId;

    private Integer actualMinutes;

    private String notes;

    private String profileName;
    private Integer breakMinutes;
}
