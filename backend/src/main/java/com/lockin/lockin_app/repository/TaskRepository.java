package com.lockin.lockin_app.repository;

import com.lockin.lockin_app.entity.Task;
import com.lockin.lockin_app.entity.TaskStatus;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface TaskRepository extends JpaRepository<Task, Long> {
    List<Task> findByUserId(Long userId);

    Page<Task> findByUserId(Long userId, Pageable pageable);

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

    @Query(
            "SELECT t FROM Task t WHERE t.user.id = :userId "
                    + "AND (LOWER(t.title) LIKE LOWER(CONCAT('%', :searchTerm, '%')) "
                    + "OR LOWER(t.description) LIKE LOWER(CONCAT('%', :searchTerm, '%'))) "
                    + "ORDER BY t.createdAt DESC")
    List<Task> searchTasks(@Param("userId") Long userId, @Param("searchTerm") String searchTerm);

    @Query(
            "SELECT t FROM Task t WHERE t.user.id = :userId "
                    + "AND (:status IS NULL OR t.status = :status) "
                    + "AND (:categoryId IS NULL OR t.category.id = :categoryId) "
                    + "AND (:isUrgent IS NULL OR t.isUrgent = :isUrgent) "
                    + "AND (:isImportant IS NULL OR t.isImportant = :isImportant) "
                    + "ORDER BY t.createdAt DESC")
    List<Task> findByFilters(
            @Param("userId") Long userId,
            @Param("status") TaskStatus status,
            @Param("categoryId") Long categoryId,
            @Param("isUrgent") Boolean isUrgent,
            @Param("isImportant") Boolean isImportant);

    @Query(
            "SELECT t FROM Task t WHERE t.user.id = :userId "
                    + "AND (:status IS NULL OR t.status = :status) "
                    + "AND (:categoryId IS NULL OR t.category.id = :categoryId) "
                    + "AND (:isUrgent IS NULL OR t.isUrgent = :isUrgent) "
                    + "AND (:isImportant IS NULL OR t.isImportant = :isImportant)")
    Page<Task> findByFiltersPaginated(
            @Param("userId") Long userId,
            @Param("status") TaskStatus status,
            @Param("categoryId") Long categoryId,
            @Param("isUrgent") Boolean isUrgent,
            @Param("isImportant") Boolean isImportant,
            Pageable pageable);

    List<Task> findByUserIdAndStatusNotOrderByCreatedAtDesc(Long userId, TaskStatus taskStatus);

    // Optimized query for analytics - only fetch tasks in date range
    @Query(
            "SELECT t FROM Task t WHERE t.user.id = :userId "
                    + "AND t.createdAt BETWEEN :start AND :end")
    List<Task> findByUserAndCreatedBetween(
            @Param("userId") Long userId,
            @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end);
}
