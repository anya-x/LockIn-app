package com.lockin.lockin_app.service;

import com.lockin.lockin_app.dto.AuthResponseDTO;
import com.lockin.lockin_app.dto.LoginDTO;
import com.lockin.lockin_app.dto.RegisterDTO;
import com.lockin.lockin_app.entity.User;
import com.lockin.lockin_app.repository.UserRepository;
import com.lockin.lockin_app.security.JwtUtil;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final AuthenticationManager authenticationManager;
    private final UserService userService;

    public AuthResponseDTO register(RegisterDTO request) {
        if (userService.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email already registered");
        }

        User user = new User();
        user.setFirstName(request.getFirstName());
        user.setLastName(request.getLastName());
        user.setEmail(request.getEmail());
        user.setPassword(passwordEncoder.encode(request.getPassword()));

        User savedUser = userRepository.save(user);
        log.info("user registered successfully: {}", savedUser.getEmail());

        String token = jwtUtil.generateToken(savedUser.getEmail());

        return new AuthResponseDTO(
                token, savedUser.getEmail(), savedUser.getFirstName(), savedUser.getLastName());
    }

    public AuthResponseDTO login(LoginDTO request) {
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

        return new AuthResponseDTO(token, user.getEmail(), user.getFirstName(), user.getLastName());
    }
}
