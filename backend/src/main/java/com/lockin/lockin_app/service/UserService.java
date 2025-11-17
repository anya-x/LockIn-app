package com.lockin.lockin_app.service;

import com.lockin.lockin_app.entity.User;
import com.lockin.lockin_app.exception.ResourceNotFoundException;
import com.lockin.lockin_app.repository.UserRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

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
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", email));
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
}
