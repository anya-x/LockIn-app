package com.lockin.lockin_app.repository;

import com.lockin.lockin_app.entity.GoogleCalendarToken;
import com.lockin.lockin_app.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * Repository for managing Google Calendar OAuth2 tokens
 */
@Repository
public interface GoogleCalendarTokenRepository extends JpaRepository<GoogleCalendarToken, Long> {

    /**
     * Find token by user
     *
     * @param user the user
     * @return optional calendar token
     */
    Optional<GoogleCalendarToken> findByUser(User user);

    /**
     * Find token by user ID
     *
     * @param userId the user ID
     * @return optional calendar token
     */
    Optional<GoogleCalendarToken> findByUserId(Long userId);

    /**
     * Check if user has connected calendar
     *
     * @param user the user
     * @return true if token exists
     */
    boolean existsByUser(User user);

    /**
     * Delete token by user
     *
     * @param user the user
     */
    void deleteByUser(User user);
}
