package com.lockin.lockin_app.repository;

import com.lockin.lockin_app.entity.Badge;
import com.lockin.lockin_app.entity.BadgeType;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BadgeRepository extends JpaRepository<Badge, Long> {

    List<Badge> findByUserIdOrderByEarnedAtDesc(Long userId);

    boolean existsByUserIdAndBadgeType(Long userId, BadgeType badgeType);

    long countByUserId(Long userId);
}