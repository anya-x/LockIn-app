package com.lockin.lockin_app.dto;

import com.lockin.lockin_app.entity.Task;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class EisenhowerMatrixDTO {

    // Quadrant 1: Urgent + Important (Do First)
    private List<Task> doFirst;

    // Quadrant 2: Not Urgent + Important (Schedule)
    private List<Task> schedule;

    // Quadrant 3: Urgent + Not Important (Delegate)
    private List<Task> delegate;

    // Quadrant 4: Not Urgent + Not Important (Eliminate)
    private List<Task> eliminate;
}
