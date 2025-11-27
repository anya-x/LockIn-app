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
import org.springframework.stereotype.Component;

import java.security.Principal;
import java.util.List;

/**
 * WebSocket authentication interceptor.
 *
 * Validates JWT token during STOMP CONNECT and sets user principal.
 * Token can be passed via:
 * 1. "Authorization" header (Bearer token)
 * 2. "token" header (raw token)
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class WebSocketAuthInterceptor implements ChannelInterceptor {

    private final JwtUtil jwtUtil;

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(
                message, StompHeaderAccessor.class);

        if (accessor == null) {
            return message;
        }

        if (StompCommand.CONNECT.equals(accessor.getCommand())) {
            String token = extractToken(accessor);

            if (token != null) {
                try {
                    String userEmail = jwtUtil.extractEmail(token);
                    if (userEmail != null && jwtUtil.validateToken(token, userEmail)) {
                        // Create principal with user email
                        Principal principal = new UsernamePasswordAuthenticationToken(
                                userEmail, null, List.of());
                        accessor.setUser(principal);
                        log.debug("WebSocket authenticated for user: {}", userEmail);
                    } else {
                        log.warn("Invalid WebSocket token");
                    }
                } catch (Exception e) {
                    log.error("WebSocket authentication failed: {}", e.getMessage());
                }
            } else {
                log.debug("No token provided for WebSocket connection");
            }
        }

        return message;
    }

    /**
     * Extract JWT token from STOMP headers.
     */
    private String extractToken(StompHeaderAccessor accessor) {
        // Try Authorization header first (Bearer token)
        List<String> authHeaders = accessor.getNativeHeader("Authorization");
        if (authHeaders != null && !authHeaders.isEmpty()) {
            String authHeader = authHeaders.get(0);
            if (authHeader.startsWith("Bearer ")) {
                return authHeader.substring(7);
            }
        }

        // Try raw token header
        List<String> tokenHeaders = accessor.getNativeHeader("token");
        if (tokenHeaders != null && !tokenHeaders.isEmpty()) {
            return tokenHeaders.get(0);
        }

        return null;
    }
}
