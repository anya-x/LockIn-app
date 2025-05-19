package com.lockin.lockin_app.dto;

import com.lockin.lockin_app.entity.FocusSession;
import com.lockin.lockin_app.entity.SessionType;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FocusSessionResponseDTO {
    private Long id;
    private Integer plannedMinutes;
    private Integer actualMinutes;
    private LocalDateTime startedAt;
    private LocalDateTime completedAt;
    private SessionType sessionType;
    private Boolean completed;
    private String notes;

    private Long userId;
    private String userFirstName;
    private String userLastName;

    private Long taskId;
    private String taskTitle;

    public static FocusSessionResponseDTO fromEntity(FocusSession session) {
        FocusSessionResponseDTOBuilder builder =
                FocusSessionResponseDTO.builder()
                        .id(session.getId())
                        .plannedMinutes(session.getPlannedMinutes())
                        .actualMinutes(session.getActualMinutes())
                        .startedAt(session.getStartedAt())
                        .completedAt(session.getCompletedAt())
                        .sessionType(session.getSessionType())
                        .completed(session.getCompleted())
                        .notes(session.getNotes());

        if (session.getUser() != null) {
            builder.userId(session.getUser().getId())
                    .userFirstName(session.getUser().getFirstName())
                    .userLastName(session.getUser().getLastName());
        }

        if (session.getTask() != null) {
            builder.taskId(session.getTask().getId()).taskTitle(session.getTask().getTitle());
        }

        return builder.build();
    }
}
