package com.lockin.lockin_app.features.focus_sessions.repository;

import com.lockin.lockin_app.features.focus_sessions.entity.FocusSession;
import com.lockin.lockin_app.features.focus_sessions.entity.SessionType;
import com.lockin.lockin_app.features.users.entity.User;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface FocusSessionRepository extends JpaRepository<FocusSession, Long> {

    List<FocusSession> findByUserIdOrderByStartedAtDesc(Long userId);

    @Query(
            "SELECT s FROM FocusSession s "
                    + "LEFT JOIN FETCH s.user "
                    + "LEFT JOIN FETCH s.task "
                    + "WHERE s.user.id = :userId "
                    + "AND s.startedAt >= :startDate AND s.startedAt < :endDate "
                    + "ORDER BY s.startedAt DESC")
    List<FocusSession> findSessionsByDateRange(
            @Param("userId") Long userId,
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate);

    @Query(
            "SELECT s FROM FocusSession s "
                    + "LEFT JOIN FETCH s.user "
                    + "LEFT JOIN FETCH s.task "
                    + "WHERE s.user.id = :userId "
                    + "AND s.sessionType = :sessionType "
                    + "AND s.completed = true "
                    + "AND s.startedAt >= :startOfDay "
                    + "AND s.startedAt < :endOfDay "
                    + "ORDER BY s.startedAt DESC")
    List<FocusSession> findTodaysCompletedSessions(
            @Param("userId") Long userId,
            @Param("sessionType") SessionType sessionType,
            @Param("startOfDay") LocalDateTime startOfDay,
            @Param("endOfDay") LocalDateTime endOfDay);

    List<FocusSession> findByUserAndStartedAtBetween(
            User user, LocalDateTime start, LocalDateTime end);

    @Query(
            "SELECT s FROM FocusSession s "
                    + "LEFT JOIN FETCH s.user "
                    + "LEFT JOIN FETCH s.task "
                    + "WHERE s.user.id = :userId "
                    + "ORDER BY s.startedAt DESC")
    List<FocusSession> findByUserIdOrderByStartedAtDescWithRelations(@Param("userId") Long userId);

    @Query(
            "SELECT s FROM FocusSession s "
                    + "LEFT JOIN FETCH s.user "
                    + "LEFT JOIN FETCH s.task "
                    + "WHERE s.user = :user "
                    + "AND s.startedAt BETWEEN :start AND :end")
    List<FocusSession> findByUserAndStartedAtBetweenWithRelations(
            @Param("user") User user,
            @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end);

    long countByUserIdAndCompleted(Long userId, Boolean completed);

    void deleteByUserId(Long userId);
}
