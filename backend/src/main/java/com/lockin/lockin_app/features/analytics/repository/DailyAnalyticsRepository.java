package com.lockin.lockin_app.features.analytics.repository;

import com.lockin.lockin_app.features.analytics.entity.DailyAnalytics;
import com.lockin.lockin_app.features.users.entity.User;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface DailyAnalyticsRepository extends JpaRepository<DailyAnalytics, Long> {

    Optional<DailyAnalytics> findByUserAndDate(User user, LocalDate date);

    List<DailyAnalytics> findByUserAndDateBetweenOrderByDateDesc(
            User user, LocalDate startDate, LocalDate endDate);

    @Query(
            "SELECT d FROM DailyAnalytics d WHERE d.user = :user "
                    + "AND d.date >= :startDate ORDER BY d.date ASC")
    List<DailyAnalytics> findLastNDays(
            @Param("user") User user, @Param("startDate") LocalDate startDate);

    void deleteByUser(User user);
}
