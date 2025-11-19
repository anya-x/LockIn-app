package com.lockin.lockin_app.repository;

import com.lockin.lockin_app.entity.AIUsage;
import com.lockin.lockin_app.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface AIUsageRepository extends JpaRepository<AIUsage, Long> {

    List<AIUsage> findByUserOrderByCreatedAtDesc(User user);

    @Query("SELECT COUNT(u) FROM AIUsage u WHERE u.user = :user " +
            "AND u.createdAt >= :since")
    long countRecentRequests(@Param("user") User user,
                             @Param("since") LocalDateTime since);

    @Query("SELECT u FROM AIUsage u WHERE u.user = :user " +
            "AND u.featureType = :featureType " +
            "AND u.createdAt >= :startOfDay " +
            "ORDER BY u.createdAt DESC LIMIT 1")
    AIUsage findTodaysBriefing(@Param("user") User user,
                               @Param("featureType") String featureType,
                               @Param("startOfDay") LocalDateTime startOfDay);
}