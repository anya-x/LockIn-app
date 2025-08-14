package com.lockin.lockin_app.features.auth.service;

import com.lockin.lockin_app.features.auth.dto.AuthResponseDTO;
import com.lockin.lockin_app.features.auth.dto.LoginRequestDTO;
import com.lockin.lockin_app.features.auth.dto.RegisterRequestDTO;
import com.lockin.lockin_app.features.users.entity.User;
import com.lockin.lockin_app.exception.ResourceNotFoundException;
import com.lockin.lockin_app.features.users.repository.UserRepository;
import com.lockin.lockin_app.security.JwtUtil;

import com.lockin.lockin_app.features.users.service.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final AuthenticationManager authenticationManager;
    private final UserService userService;

    /**
     * Registers a new user account
     *
     * @param request user registration details
     * @return authentication response with token and user infos
     * @throws ResourceNotFoundException if email already exists
     */
    @Transactional
    public AuthResponseDTO register(RegisterRequestDTO request) {
        if (userService.existsByEmail(request.getEmail())) {
            throw new ResourceNotFoundException("Email already registered: " + request.getEmail());
        }

        User user = new User();
        user.setFirstName(request.getFirstName());
        user.setLastName(request.getLastName());
        user.setEmail(request.getEmail());
        user.setPassword(passwordEncoder.encode(request.getPassword()));

        User savedUser = userRepository.save(user);
        String token = jwtUtil.generateToken(savedUser.getEmail());

        log.info("User registered successfully: {}", savedUser.getEmail());

        return AuthResponseDTO.builder()
                .token(token)
                .user(
                        AuthResponseDTO.UserInfo.builder()
                                .id(savedUser.getId())
                                .email(savedUser.getEmail())
                                .firstName(savedUser.getFirstName())
                                .lastName(savedUser.getLastName())
                                .build())
                .build();
    }

    /**
     * Authentificates user and generates JWT token
     *
     * @param request login credentials
     * @return authentification response with token and user info
     * @throws AuthenticationException if credentials are invalid
     */
    public AuthResponseDTO login(LoginRequestDTO request) {
        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            request.getEmail(), request.getPassword()));

            log.info("Authentication successful for: {}", request.getEmail());
        } catch (AuthenticationException e) {
            log.warn("Authentication failed for: {}", request.getEmail());
            throw e;
        }

        User user = userService.getUserByEmail(request.getEmail());
        String token = jwtUtil.generateToken(user.getEmail());

        return AuthResponseDTO.builder()
                .token(token)
                .user(
                        AuthResponseDTO.UserInfo.builder()
                                .id(user.getId())
                                .email(user.getEmail())
                                .firstName(user.getFirstName())
                                .lastName(user.getLastName())
                                .build())
                .build();
    }
}
