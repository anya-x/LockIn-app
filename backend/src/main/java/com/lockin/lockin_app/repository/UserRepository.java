package com.lockin.lockin_app.repository;


import com.lockin.lockin_app.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long>  {
    Optional<User> findByEmail(String email);
    boolean existsByEmail(String email);

    @Query("SELECT u FROM User u WHERE u.lastActivityDate < :cutoffDate AND u.currentStreak > 0")
    List<User> findUsersWithBrokenStreaks(@Param("cutoffDate") LocalDate cutoffDate);
}