package com.lockin.lockin_app.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

/**
 * WebSocket configuration for real-time notifications
 *
 * Architecture:
 * - STOMP (Simple Text Oriented Messaging Protocol) over WebSocket
 * - In-memory message broker for simplicity
 * - Can be upgraded to external broker (RabbitMQ/Redis) for scale
 *
 * Endpoints:
 * - /ws - WebSocket handshake endpoint
 * - /app - Application destination prefix
 * - /topic - Message broker destination prefix (pub/sub)
 * - /user - User-specific destinations
 *
 * Example Usage:
 * Client subscribes: /topic/notifications/{userId}
 * Server sends: messagingTemplate.convertAndSend("/topic/notifications/123", notification)
 */
@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    /**
     * Configure message broker
     *
     * /topic - Public topics (one-to-many broadcast)
     * /queue - Point-to-point messages
     * /app - Application destination prefix for messages from clients
     */
    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        // Enable simple in-memory broker
        // Destinations: /topic for broadcasts, /queue for point-to-point
        config.enableSimpleBroker("/topic", "/queue");

        // Prefix for messages FROM client TO server
        // e.g., client sends to /app/sendMessage, handled by @MessageMapping("/sendMessage")
        config.setApplicationDestinationPrefixes("/app");

        // Prefix for user-specific messages
        // e.g., /user/123/queue/notifications
        config.setUserDestinationPrefix("/user");
    }

    /**
     * Register STOMP endpoints
     *
     * Endpoint: /ws
     * - SockJS fallback for browsers that don't support WebSocket
     * - CORS allowed from all origins (configure for production!)
     */
    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint("/ws")
                .setAllowedOriginPatterns("*") // Configure for production!
                .withSockJS(); // Fallback for browsers without WebSocket support

        // Also register without SockJS for native WebSocket clients
        registry.addEndpoint("/ws")
                .setAllowedOriginPatterns("*");
    }

    /*
     * PRODUCTION CONFIGURATION NOTES:
     *
     * 1. Configure allowed origins properly:
     *    .setAllowedOrigins("https://yourdomain.com", "https://app.yourdomain.com")
     *
     * 2. Add authentication (see WebSocketSecurityConfig example below)
     *
     * 3. For scale, use external message broker:
     *    config.enableStompBrokerRelay("/topic", "/queue")
     *          .setRelayHost("localhost")
     *          .setRelayPort(61613)
     *          .setClientLogin("guest")
     *          .setClientPasscode("guest");
     *
     * 4. Configure heartbeat for connection health:
     *    config.enableSimpleBroker("/topic", "/queue")
     *          .setHeartbeatValue(new long[]{10000, 10000});
     *
     * 5. Set message size limits:
     *    registry.addEndpoint("/ws")
     *            .setAllowedOrigins("...")
     *            .setHandshakeHandler(new DefaultHandshakeHandler() {
     *                @Override
     *                protected Principal determineUser(...) {
     *                    // Return authenticated user
     *                }
     *            });
     */
}

/*
 * EXAMPLE WebSocket Security Configuration (commented out for now):
 *
 * @Configuration
 * public class WebSocketSecurityConfig extends AbstractSecurityWebSocketMessageBrokerConfigurer {
 *
 *     @Override
 *     protected void configureInbound(MessageSecurityMetadataSourceRegistry messages) {
 *         messages
 *             .simpDestMatchers("/app/**").authenticated()
 *             .simpSubscribeDestMatchers("/user/**", "/topic/**").authenticated()
 *             .anyMessage().denyAll();
 *     }
 *
 *     @Override
 *     protected boolean sameOriginDisabled() {
 *         return true; // Allow same-origin requests
 *     }
 * }
 */
