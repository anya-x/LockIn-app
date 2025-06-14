package com.lockin.lockin_app.repository;

import com.lockin.lockin_app.entity.DailyAnalytics;
import com.lockin.lockin_app.entity.User;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
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
    List<DailyAnalytics> findLast30Days(User user, LocalDate startDate);

    // TODO: queries for trends
}
