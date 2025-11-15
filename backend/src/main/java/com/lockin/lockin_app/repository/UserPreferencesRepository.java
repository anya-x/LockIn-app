package com.lockin.lockin_app.repository;

import com.lockin.lockin_app.entity.UserPreferences;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * Repository for user notification preferences
 *
 * Simple repo since UserPreferences has one-to-one relationship with User
 */
@Repository
public interface UserPreferencesRepository extends JpaRepository<UserPreferences, Long> {

    /**
     * Find preferences by user ID
     *
     * @param userId the user ID
     * @return Optional containing preferences if found
     */
    Optional<UserPreferences> findByUserId(Long userId);
}
