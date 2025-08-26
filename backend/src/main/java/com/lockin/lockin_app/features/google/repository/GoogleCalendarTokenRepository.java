package com.lockin.lockin_app.features.google.repository;

import com.lockin.lockin_app.features.google.entity.GoogleCalendarToken;
import com.lockin.lockin_app.features.users.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface GoogleCalendarTokenRepository extends JpaRepository<GoogleCalendarToken, Long> {

    Optional<GoogleCalendarToken> findByUser(User user);

    boolean existsByUser(User user);

    void deleteByUser(User user);
}