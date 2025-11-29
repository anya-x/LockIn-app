package com.lockin.lockin_app.features.badges.repository;

import com.lockin.lockin_app.features.badges.entity.Badge;
import com.lockin.lockin_app.features.badges.entity.BadgeType;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BadgeRepository extends JpaRepository<Badge, Long> {

    List<Badge> findByUserIdOrderByEarnedAtDesc(Long userId);

    boolean existsByUserIdAndBadgeType(Long userId, BadgeType badgeType);

    long countByUserId(Long userId);

    void deleteByUserId(Long userId);
}