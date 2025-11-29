package com.lockin.lockin_app.config;

import com.lockin.lockin_app.security.JwtUtil;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.stereotype.Component;

import java.util.Collections;

/**
 * Intercepts WebSocket STOMP messages to validate JWT authentication.
 * Extracts the Authorization header from CONNECT frames and validates the JWT token.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class WebSocketAuthInterceptor implements ChannelInterceptor {

    private final JwtUtil jwtUtil;

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor =
                MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);

        if (accessor == null) {
            return message;
        }

        // Only validate on CONNECT command
        if (StompCommand.CONNECT.equals(accessor.getCommand())) {
            String authHeader = accessor.getFirstNativeHeader("Authorization");

            if (authHeader == null || !authHeader.startsWith("Bearer ")) {
                log.warn("WebSocket connection rejected: Missing or invalid Authorization header");
                throw new IllegalArgumentException("Missing or invalid Authorization header");
            }

            String token = authHeader.substring(7);

            try {
                String email = jwtUtil.extractEmail(token);

                if (email != null && jwtUtil.validateToken(token, email)) {
                    log.debug("WebSocket authenticated for user: {}", email);

                    // Set the authenticated user principal
                    UsernamePasswordAuthenticationToken auth =
                            new UsernamePasswordAuthenticationToken(
                                    email,
                                    null,
                                    Collections.singletonList(new SimpleGrantedAuthority("ROLE_USER")));

                    accessor.setUser(auth);
                } else {
                    log.warn("WebSocket connection rejected: Invalid token for user");
                    throw new IllegalArgumentException("Invalid authentication token");
                }
            } catch (Exception e) {
                log.error("WebSocket authentication failed: {}", e.getMessage());
                throw new IllegalArgumentException("Authentication failed: " + e.getMessage());
            }
        }

        return message;
    }
}
