package com.lockin.lockin_app.dto;

import com.lockin.lockin_app.entity.GoalTemplate;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GoalTemplateDTO {

    private String templateType;
    private String name;
    private String description;
    private Integer tasksTarget;
    private Integer pomodorosTarget;
    private Integer focusMinutesTarget;
    private Integer durationDays;

    public static GoalTemplateDTO fromTemplate(GoalTemplate template) {
        return GoalTemplateDTO.builder()
                .templateType(template.name())
                .name(template.getName())
                .description(template.getDescription())
                .tasksTarget(template.getTasksTarget())
                .pomodorosTarget(template.getPomodorosTarget())
                .focusMinutesTarget(template.getFocusMinutesTarget())
                .durationDays(template.getDurationDays())
                .build();
    }
}
