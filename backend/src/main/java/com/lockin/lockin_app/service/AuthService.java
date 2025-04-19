package com.lockin.lockin_app.service;

import com.lockin.lockin_app.dto.AuthResponseDTO;
import com.lockin.lockin_app.dto.LoginRequestDTO;
import com.lockin.lockin_app.dto.RegisterRequestDTO;
import com.lockin.lockin_app.entity.User;
import com.lockin.lockin_app.repository.UserRepository;
import com.lockin.lockin_app.security.JwtUtil;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
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

    @Transactional
    public AuthResponseDTO register(RegisterRequestDTO request) {
        if (userService.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email already registered");
        }

        User user = new User();
        user.setFirstName(request.getFirstName());
        user.setLastName(request.getLastName());
        user.setEmail(request.getEmail());
        user.setPassword(passwordEncoder.encode(request.getPassword()));

        User savedUser = userRepository.save(user);
        String token = jwtUtil.generateToken(savedUser.getEmail());

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

    public AuthResponseDTO login(LoginRequestDTO request) {
        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            request.getEmail(), request.getPassword()));

            log.info("Authentification successful for: {}", request.getEmail());
        } catch (Exception e) {
            log.warn(
                    "Authentification failed for email: {}  Reason: {}",
                    request.getEmail(),
                    e.getMessage());
            throw e;
        }

        User user = userService.getUserByEmail(request.getEmail());

        String token = jwtUtil.generateToken(user.getEmail());
        log.debug("JWT token generated");

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
