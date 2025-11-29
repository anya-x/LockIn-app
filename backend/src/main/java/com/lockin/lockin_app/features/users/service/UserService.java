package com.lockin.lockin_app.features.users.service;

import com.lockin.lockin_app.features.users.entity.User;
import com.lockin.lockin_app.features.users.dto.NotificationPreferencesDTO;
import com.lockin.lockin_app.exception.ResourceNotFoundException;
import com.lockin.lockin_app.features.users.repository.UserRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public User getUserByEmail(String email) {
        log.debug("Getting user by email: {}", email);

        return userRepository
                .findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("User not found: " + email));
    }

    @Transactional(readOnly = true)
    public Long getUserIdFromEmail(String email) {
        log.debug("Getting user ID for email: {}", email);

        return getUserByEmail(email).getId();
    }

    @Transactional(readOnly = true)
    public User getUserById(Long id) {
        log.debug("Getting user by ID: {}", id);

        return userRepository
                .findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", id));
    }

    @Transactional(readOnly = true)
    public boolean existsByEmail(String email) {
        return userRepository.existsByEmail(email);
    }

    @Transactional(readOnly = true)
    public NotificationPreferencesDTO getNotificationPreferences(Long userId) {
        log.debug("Getting notification preferences for user: {}", userId);

        User user = getUserById(userId);
        return NotificationPreferencesDTO.fromUser(user);
    }

    @Transactional
    public NotificationPreferencesDTO updateNotificationPreferences(
            Long userId,
            NotificationPreferencesDTO preferences) {
        log.info("Updating notification preferences for user: {}", userId);

        User user = getUserById(userId);

        if (preferences.getAiNotifications() != null) {
            user.setNotifyAiFeatures(preferences.getAiNotifications());
        }
        if (preferences.getCalendarNotifications() != null) {
            user.setNotifyCalendarSync(preferences.getCalendarNotifications());
        }
        if (preferences.getTaskReminders() != null) {
            user.setNotifyTaskReminders(preferences.getTaskReminders());
        }

        user = userRepository.save(user);
        return NotificationPreferencesDTO.fromUser(user);
    }
}
