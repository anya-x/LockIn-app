package com.lockin.lockin_app.repository;

import com.lockin.lockin_app.entity.Goal;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface GoalRepository extends JpaRepository<Goal, Long> {
    List<Goal> findByUserIdOrderByCreatedAtDesc(Long userId);

    List<Goal> findByUserIdAndCompletedOrderByCreatedAtDesc(Long userId, Boolean completed);
}
