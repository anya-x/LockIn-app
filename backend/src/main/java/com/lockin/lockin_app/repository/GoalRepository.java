package com.lockin.lockin_app.repository;

import com.lockin.lockin_app.entity.Goal;
import com.lockin.lockin_app.entity.Goal.GoalType;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface GoalRepository extends JpaRepository<Goal, Long> {

    List<Goal> findByUserIdOrderByCreatedAtDesc(Long userId);

    Page<Goal> findByUserId(Long userId, Pageable pageable);

    List<Goal> findByUserIdAndCompletedOrderByCreatedAtDesc(Long userId, Boolean completed);

    List<Goal> findByUserIdAndTypeOrderByCreatedAtDesc(Long userId, GoalType type);

    long countByUserIdAndCompleted(Long userId, Boolean completed);

}