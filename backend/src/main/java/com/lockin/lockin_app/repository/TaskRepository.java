package com.lockin.lockin_app.repository;

import com.lockin.lockin_app.entity.Task;
import com.lockin.lockin_app.entity.TaskStatus;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TaskRepository extends JpaRepository<Task, Long> {
    List<Task> findByUserId(Long userId);

    List<Task> findByUserIdAndStatus(Long userId, TaskStatus status);

    List<Task> findByUserIdAndIsUrgentAndIsImportant(
            Long userId, Boolean isUrgent, Boolean isImportant);
}
