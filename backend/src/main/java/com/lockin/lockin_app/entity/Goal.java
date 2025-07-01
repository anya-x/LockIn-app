package com.lockin.lockin_app.entity;

import jakarta.persistence.*;

import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "goals")
@Setter
@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Goal {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    private String title;

    @Column(length = 1000)
    private String description;

    @Enumerated(EnumType.STRING)
    private GoalType type; // DAILY, WEEKLY, MONTHLY

    private Integer targetTasks;
    private Integer targetPomodoros;
    private Integer targetFocusMinutes;

    private Integer currentTasks = 0;
    private Integer currentPomodoros = 0;
    private Integer currentFocusMinutes = 0;

    private Boolean completed = false;
    private LocalDate completedDate;

    private LocalDate startDate;
    private LocalDate endDate;

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

    public enum GoalType {
        DAILY,
        WEEKLY,
        MONTHLY
    }
}
