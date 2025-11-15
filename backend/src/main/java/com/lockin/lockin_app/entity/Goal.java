package com.lockin.lockin_app.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "goals")
@Getter
@Setter
public class Goal {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank
    @Size(max = 200)
    private String title;

    @Column(length = 1000)
    private String description;

    @Enumerated(EnumType.STRING)
    private GoalType type;

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

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

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

    /**
     * Calculates progress percentage across all defined targets
     *
     * @return average progress percentage (0-100), or 0 if no targets are set
     */
    public double getProgressPercentage() {
        int targetCount = 0;
        double achievedScore = 0;

        // Each metric is capped at 100% to prevent over-achievement inflation
        if (targetTasks != null && targetTasks > 0) {
            targetCount++;
            double taskProgress = Math.min(100, (currentTasks / (double) targetTasks) * 100);
            achievedScore += taskProgress;
        }

        if (targetPomodoros != null && targetPomodoros > 0) {
            targetCount++;
            double pomodoroProgress =
                    Math.min(100, (currentPomodoros / (double) targetPomodoros) * 100);
            achievedScore += pomodoroProgress;
        }

        if (targetFocusMinutes != null && targetFocusMinutes > 0) {
            targetCount++;
            double focusProgress =
                    Math.min(100, (currentFocusMinutes / (double) targetFocusMinutes) * 100);
            achievedScore += focusProgress;
        }

        // FIX: Handle division by zero when no targets are set
        if (targetCount == 0) {
            return 0.0;  // No targets set, return 0%
        }

        return achievedScore / targetCount;
    }
}
