package com.lockin.lockin_app.repository;

import com.lockin.lockin_app.entity.FocusSession;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface FocusSessionRepository extends JpaRepository<FocusSession, Long> {
    List<FocusSession> findByUserIdOrderByStartedAtDesc(Long userId);
}
