package com.lockin.lockin_app.repository;

import com.lockin.lockin_app.entity.Badge;
import com.lockin.lockin_app.entity.BadgeType;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface BadgeRepository extends JpaRepository<Badge, Long> {

    List<Badge> findByUserIdOrderByEarnedAtDesc(Long userId);

    Optional<Badge> findByUserIdAndBadgeType(Long userId, BadgeType badgeType);

    boolean existsByUserIdAndBadgeType(Long userId, BadgeType badgeType);
}