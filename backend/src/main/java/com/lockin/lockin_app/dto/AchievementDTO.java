package com.lockin.lockin_app.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

/**
 * DTO for user achievements and milestones
 *
 * <p>Achievements are calculated dynamically based on user activity and not stored in database
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AchievementDTO {

    private String id;
    private String title;
    private String description;
    private String category; // TASKS, FOCUS, STREAK, GOALS
    private boolean unlocked;
    private LocalDate unlockedDate;
    private int progress;
    private int target;

    /**
     * Calculates completion percentage
     *
     * @return percentage (0-100)
     */
    public double getProgressPercentage() {
        if (target == 0) {
            return 0.0;
        }
        return Math.min(100.0, (progress / (double) target) * 100);
    }
}
