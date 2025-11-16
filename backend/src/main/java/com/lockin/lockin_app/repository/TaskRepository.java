package com.lockin.lockin_app.repository;

import com.lockin.lockin_app.entity.Task;
import com.lockin.lockin_app.entity.TaskStatus;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface TaskRepository extends JpaRepository<Task, Long> {
    List<Task> findByUserId(Long userId);

    @Query("SELECT t FROM Task t LEFT JOIN FETCH t.category WHERE t.user.id = :userId")
    Page<Task> findByUserId(@Param("userId") Long userId, Pageable pageable);

    List<Task> findByUserIdAndStatus(Long userId, TaskStatus status);

    List<Task> findByUserIdAndIsUrgentAndIsImportant(
            Long userId, Boolean isUrgent, Boolean isImportant);

    List<Task> findByUserIdOrderByCreatedAtDesc(Long userId);

    @Query("SELECT t FROM Task t LEFT JOIN FETCH t.category WHERE t.user.id = :userId")
    List<Task> findByUserIdWithCategory(@Param("userId") Long userId);

    @Query(
            "SELECT t FROM Task t LEFT JOIN FETCH t.category WHERE t.user.id = :userId AND t.status = :status")
    List<Task> findByUserIdAndStatusWithCategory(
            @Param("userId") Long userId, @Param("status") TaskStatus status);

    @Query(
            "SELECT t FROM Task t LEFT JOIN FETCH t.category WHERE t.user.id = :userId ORDER BY t.createdAt DESC")
    List<Task> findByUserIdOrderByCreatedAtDescWithCategory(@Param("userId") Long userId);

    @Query(
            "SELECT t FROM Task t LEFT JOIN FETCH t.category WHERE t.user.id = :userId AND t.status <> :status ORDER BY t.createdAt DESC")
    List<Task> findByUserIdAndStatusNotOrderByCreatedAtDescWithCategory(
            @Param("userId") Long userId, @Param("status") TaskStatus status);

    @Query(
            "SELECT t FROM Task t LEFT JOIN FETCH t.category WHERE t.user.id = :userId "
                    + "AND t.isUrgent = :isUrgent AND t.isImportant = :isImportant "
                    + "ORDER BY t.dueDate ASC")
    List<Task> findByQuadrant(
            @Param("userId") Long userId,
            @Param("isUrgent") Boolean isUrgent,
            @Param("isImportant") Boolean isImportant);

    @Query(
            "SELECT t FROM Task t LEFT JOIN FETCH t.category WHERE t.user.id = :userId "
                    + "AND (LOWER(t.title) LIKE LOWER(CONCAT('%', :searchTerm, '%')) "
                    + "OR LOWER(t.description) LIKE LOWER(CONCAT('%', :searchTerm, '%'))) "
                    + "ORDER BY t.createdAt DESC")
    List<Task> searchTasks(@Param("userId") Long userId, @Param("searchTerm") String searchTerm);

    @Query(
            "SELECT t FROM Task t LEFT JOIN FETCH t.category WHERE t.user.id = :userId "
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
            "SELECT t FROM Task t LEFT JOIN FETCH t.category WHERE t.user.id = :userId "
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

    @Modifying
    @Query("UPDATE Task t SET t.category = null WHERE t.category.id = :categoryId")
    void removeCategoryFromTasks(@Param("categoryId") Long categoryId);

    // Count queries for statistics
    Long countByUserId(Long userId);

    Long countByUserIdAndStatus(Long userId, TaskStatus status);

    Long countByUserIdAndIsUrgent(Long userId, Boolean isUrgent);

    Long countByUserIdAndIsImportant(Long userId, Boolean isImportant);

    Long countByUserIdAndIsUrgentAndIsImportant(
            Long userId, Boolean isUrgent, Boolean isImportant);

    @Query(
            "SELECT t.category.name, COUNT(t) FROM Task t WHERE t.user.id = :userId AND t.category IS NOT NULL GROUP BY t.category.name")
    List<Object[]> countTasksByCategory(@Param("userId") Long userId);

    @Query("SELECT COUNT(t) FROM Task t WHERE t.user.id = :userId AND t.createdAt > :date")
    Long countByUserIdAndCreatedAtAfter(@Param("userId") Long userId, @Param("date") LocalDateTime date);

    @Query(
            "SELECT COUNT(t) FROM Task t WHERE t.user.id = :userId AND t.completedAt IS NOT NULL AND t.completedAt > :date")
    Long countByUserIdAndCompletedAtAfter(
            @Param("userId") Long userId, @Param("date") LocalDateTime date);

    // Date range queries with JOIN FETCH to prevent N+1
    @Query(
            "SELECT t FROM Task t LEFT JOIN FETCH t.category WHERE t.user.id = :userId "
                    + "AND t.createdAt >= :startDate AND t.createdAt < :endDate")
    List<Task> findByUserIdAndCreatedAtBetween(
            @Param("userId") Long userId,
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate);

    @Query(
            "SELECT t FROM Task t LEFT JOIN FETCH t.category WHERE t.user.id = :userId "
                    + "AND t.status = :status "
                    + "AND t.updatedAt >= :startDate AND t.updatedAt < :endDate")
    List<Task> findByUserIdAndStatusAndUpdatedAtBetween(
            @Param("userId") Long userId,
            @Param("status") TaskStatus status,
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate);

    @Query(
            "SELECT t FROM Task t LEFT JOIN FETCH t.category WHERE t.user.id = :userId "
                    + "AND t.status <> :status")
    List<Task> findByUserIdAndStatusNotWithCategory(
            @Param("userId") Long userId, @Param("status") TaskStatus status);
}
