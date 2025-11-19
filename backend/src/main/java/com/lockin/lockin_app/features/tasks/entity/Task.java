package com.lockin.lockin_app.features.tasks.entity;

import com.lockin.lockin_app.features.categories.entity.Category;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(
        name = "tasks",
        indexes = {
            @Index(name = "idx_tasks_user_status", columnList = "user_id, status"),
            @Index(name = "idx_tasks_user_created", columnList = "user_id, created_at"),
            @Index(name = "idx_tasks_user_due_date", columnList = "user_id, due_date"),
            @Index(name = "idx_tasks_category", columnList = "category_id")
        })
@Getter
@Setter
public class Task {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank
    @Size(max = 200)
    private String title;

    @Column(length = 2000)
    private String description;

    @Enumerated(EnumType.STRING)
    private TaskStatus status = TaskStatus.TODO;

    // Eisenhower Matrix
    private Boolean isUrgent = false;
    private Boolean isImportant = false;

    private LocalDateTime dueDate;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id")
    private Category category;

    @Column(name = "completed_at")
    private LocalDateTime completedAt;

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
