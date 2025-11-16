package com.lockin.lockin_app.repository;

import com.lockin.lockin_app.entity.FocusSession;
import com.lockin.lockin_app.entity.SessionType;
import com.lockin.lockin_app.entity.User;

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
            "SELECT s FROM FocusSession s WHERE s.user.id = :userId "
                    + "AND s.startedAt >= :startDate AND s.startedAt < :endDate "
                    + "ORDER BY s.startedAt DESC")
    List<FocusSession> findSessionsByDateRange(
            @Param("userId") Long userId,
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate);

    @Query(
            "SELECT s FROM FocusSession s WHERE s.user.id = :userId "
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

    // DECISION: Commenting out time-of-day analysis (not ready)
    // Reasons:
    // 1. Timezone complexity not worth it right now
    // 2. Not sure users actually need this
    // 3. Other features more important
    // 4. Can add later if users request it
    //
    // Keeping code commented in case I revisit later.
    // Focus on finishing core analytics features first!
    /*
    @Query("SELECT HOUR(fs.startedAt) as hour, " +
           "COUNT(fs) as count, " +
           "AVG(fs.workDuration) as avgDuration " +
           "FROM FocusSession fs " +
           "WHERE fs.user = :user " +
           "AND fs.startedAt BETWEEN :start AND :end " +
           "GROUP BY HOUR(fs.startedAt)")
    List<Object[]> getHourlyDistribution(
            @Param("user") User user,
            @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end);
    */
}
