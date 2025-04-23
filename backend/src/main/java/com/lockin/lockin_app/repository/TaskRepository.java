package com.lockin.lockin_app.repository;

import com.lockin.lockin_app.entity.Task;
import com.lockin.lockin_app.entity.TaskStatus;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TaskRepository extends JpaRepository<Task, Long> {
    List<Task> findByUserId(Long userId);

    List<Task> findByUserIdAndStatus(Long userId, TaskStatus status);

    List<Task> findByUserIdAndIsUrgentAndIsImportant(
            Long userId, Boolean isUrgent, Boolean isImportant);

    List<Task> findByUserIdOrderByCreatedAtDesc(Long userId);

    @Query(
            "SELECT t FROM Task t WHERE t.user.id = :userId "
                    + "AND t.isUrgent = :isUrgent AND t.isImportant = :isImportant "
                    + "ORDER BY t.dueDate ASC")
    List<Task> findByQuadrant(
            @Param("userId") Long userId,
            @Param("isUrgent") Boolean isUrgent,
            @Param("isImportant") Boolean isImportant);
}
