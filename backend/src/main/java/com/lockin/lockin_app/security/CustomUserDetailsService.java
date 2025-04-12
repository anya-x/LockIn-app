package com.lockin.lockin_app.security;

import com.lockin.lockin_app.entity.User;
import com.lockin.lockin_app.repository.UserRepository;

import lombok.extern.slf4j.Slf4j;

import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.ArrayList;

@Slf4j
@Service
public class CustomUserDetailsService implements UserDetailsService {

    private final UserRepository userRepository;

    public CustomUserDetailsService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        log.debug("Loading user: {}", email);

        User user =
                userRepository
                        .findByEmail(email)
                        .orElseThrow(
                                () -> {
                                    log.warn("User not found: {}", email);
                                    return new UsernameNotFoundException(
                                            "User not found: " + email);
                                });

        log.debug("User loading success");

        return new org.springframework.security.core.userdetails.User(
                user.getEmail(), user.getPassword(), new ArrayList<>() // TODO: Add role system
                );
    }
}
