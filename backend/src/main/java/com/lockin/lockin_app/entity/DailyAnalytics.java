package com.lockin.lockin_app.entity;

import jakarta.persistence.*;

import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(
        name = "daily_analytics",
        indexes = {@Index(name = "idx_analytics_user_date", columnList = "user_id,date")})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DailyAnalytics {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false)
    private LocalDate date;

    // Task metrics
    private Integer tasksCreated = 0;
    private Integer tasksCompleted = 0;
    private Integer tasksDeleted = 0;
    private Double completionRate = 0.0;

    // Pomodoro metrics
    private Integer pomodorosCompleted = 0;
    private Integer focusMinutes = 0;
    private Integer breakMinutes = 0;
    private Integer interruptedSessions = 0;

    // Eisenhower distributions
    private Integer urgentImportantCount = 0;
    private Integer notUrgentImportantCount = 0;
    private Integer urgentNotImportantCount = 0;
    private Integer notUrgentNotImportantCount = 0;

    // Scores (0-100)
    private Double productivityScore = 0.0;
    private Double focusScore = 0.0;
    private Double burnoutRiskScore = 0.0;

    // Burnout indicators
    private Integer overworkMinutes = 0;
    private Integer consecutiveWorkDays = 0;
    private Integer lateNightSessions = 0;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
