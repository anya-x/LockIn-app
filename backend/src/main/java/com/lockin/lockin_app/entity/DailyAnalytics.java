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
    @Builder.Default private Integer tasksCreated = 0;
    @Builder.Default private Integer tasksCompleted = 0;
    @Builder.Default private Integer tasksCompletedFromToday = 0;
    @Builder.Default private Integer tasksDeleted = 0;
    @Builder.Default private Double completionRate = 0.0;

    // Pomodoro metrics
    @Builder.Default private Integer pomodorosCompleted = 0;
    @Builder.Default private Integer focusMinutes = 0;
    @Builder.Default private Integer breakMinutes = 0;
    @Builder.Default private Integer interruptedSessions = 0;

    // Time of day productivity (focus minutes)
    @Builder.Default private Integer morningFocusMinutes = 0; // 6 AM - 12 PM
    @Builder.Default private Integer afternoonFocusMinutes = 0; // 12 PM - 6 PM
    @Builder.Default private Integer eveningFocusMinutes = 0; // 6 PM - 12 AM
    @Builder.Default private Integer nightFocusMinutes = 0; // 12 AM - 6 AM

    // Eisenhower distributions
    @Builder.Default private Integer urgentImportantCount = 0;
    @Builder.Default private Integer notUrgentImportantCount = 0;
    @Builder.Default private Integer urgentNotImportantCount = 0;
    @Builder.Default private Integer notUrgentNotImportantCount = 0;

    // Scores (0-100)
    @Builder.Default private Double productivityScore = 0.0;
    @Builder.Default private Double focusScore = 0.0;
    @Builder.Default private Double burnoutRiskScore = 0.0;

    // Burnout indicators
    @Builder.Default private Integer overworkMinutes = 0;
    @Builder.Default private Integer consecutiveWorkDays = 0;
    @Builder.Default private Integer lateNightSessions = 0;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    /*
        @ElementCollection
        @CollectionTable(name = "daily_profile_usage",
            joinColumns = @JoinColumn(name = "analytics_id"))
        @MapKeyColumn(name = "profile_id")
        @Column(name = "usage_count")
        private Map<String, Integer> focusProfileUsage = new HashMap<>();

        @Column(name = "most_used_profile")
        private String mostUsedProfile;
    */

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
