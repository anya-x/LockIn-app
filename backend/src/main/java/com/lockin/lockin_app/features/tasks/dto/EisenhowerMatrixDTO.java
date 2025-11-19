package com.lockin.lockin_app.features.tasks.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class EisenhowerMatrixDTO {

    // Quadrant 1: Urgent + Important (Do First)
    private List<TaskResponseDTO> doFirst;

    // Quadrant 2: Not Urgent + Important (Schedule)
    private List<TaskResponseDTO> schedule;

    // Quadrant 3: Urgent + Not Important (Delegate)
    private List<TaskResponseDTO> delegate;

    // Quadrant 4: Not Urgent + Not Important (Eliminate)
    private List<TaskResponseDTO> eliminate;
}
