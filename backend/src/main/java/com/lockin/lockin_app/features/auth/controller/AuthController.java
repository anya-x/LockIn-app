package com.lockin.lockin_app.features.auth.controller;

import com.lockin.lockin_app.features.auth.dto.AuthResponseDTO;
import com.lockin.lockin_app.features.auth.dto.LoginRequestDTO;
import com.lockin.lockin_app.features.auth.dto.RegisterRequestDTO;
import com.lockin.lockin_app.exception.ResourceNotFoundException;
import com.lockin.lockin_app.features.auth.service.AuthService;

import jakarta.validation.Valid;

import lombok.extern.slf4j.Slf4j;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.AuthenticationException;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Slf4j
@RestController
@RequestMapping("/api/auth")
public class AuthController extends BaseController {

    private final AuthService authService;

    public AuthController(UserService userService, AuthService authService) {
        super(userService);
        this.authService = authService;
    }

    /**
     * Registers a new user account: creates user with encoded password and generates JWT token for
     * login
     *
     * @param request user details (email, password, name)
     * @return authentication response with JWT token and user infos
     * @throws ResourceNotFoundException if email already exists
     */
    @PostMapping("/register")
    public ResponseEntity<AuthResponseDTO> register(
            @Valid @RequestBody RegisterRequestDTO request) {
        log.info("POST /api/auth/register : email: {}", request.getEmail());

        AuthResponseDTO response = authService.register(request);

        log.info("Registration successful : {}", request.getEmail());

        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * Authentificcates user and generates JWT token
     *
     * @param request login credentials (email and password)
     * @return authentification response with JWT token and user infos
     * @throws AuthenticationException if credentials are not valid
     */
    @PostMapping("/login")
    public ResponseEntity<AuthResponseDTO> login(@Valid @RequestBody LoginRequestDTO request) {
        log.info("POST /api/auth/login : email: {}", request.getEmail());

        AuthResponseDTO response = authService.login(request);

        log.info("Login successful: {}", request.getEmail());

        return ResponseEntity.ok(response);
    }
}
