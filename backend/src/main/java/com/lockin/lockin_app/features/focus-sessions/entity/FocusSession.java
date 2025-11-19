package com.lockin.lockin_app.features.focus_sessions.entity;

import jakarta.persistence.*;

import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(
        name = "focus_sessions",
        indexes = {
            @Index(name = "idx_focus_sessions_user_started", columnList = "user_id, started_at"),
            @Index(name = "idx_focus_sessions_started", columnList = "started_at"),
            @Index(name = "idx_focus_sessions_task", columnList = "task_id")
        })
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class FocusSession {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "task_id")
    private Task task;

    @Column(nullable = false)
    private Integer plannedMinutes;

    @Column(nullable = false)
    private Integer actualMinutes;

    @Column(nullable = false)
    private LocalDateTime startedAt;

    @Column private LocalDateTime completedAt;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private SessionType sessionType;

    @Column(nullable = false)
    private Boolean completed = false;

    @Column private String notes;

    @Column(length = 50)
    private String profileName;

    @Column private Integer breakMinutes;

    public int getWorkDuration() {
        if (Boolean.TRUE.equals(completed) && actualMinutes != null) {
            return actualMinutes;
        }
        return plannedMinutes != null ? plannedMinutes : 0;
    }
}
