package com.lockin.lockin_app.config;

import jakarta.annotation.PostConstruct;
import lombok.Data;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Slf4j
@Data
@Configuration
@ConfigurationProperties(prefix = "google.oauth")
public class GoogleOAuthConfig {

    private String clientId;
    private String clientSecret;
    private String redirectUri;
    private String scopes;

    @PostConstruct
    public void validate() {
        log.info("Validating Google OAuth configuration...");

        if (clientId == null || clientId.isEmpty()) {
            throw new IllegalStateException(
                    "GOOGLE_CLIENT_ID must be set! " +
                            "Get your credentials from Google Cloud Console: " +
                            "https://console.cloud.google.com/apis/credentials");
        }

        if (clientSecret == null || clientSecret.isEmpty()) {
            throw new IllegalStateException(
                    "GOOGLE_CLIENT_SECRET must be set! " +
                            "Get your credentials from Google Cloud Console.");
        }

        if (redirectUri == null || redirectUri.isEmpty()) {
            throw new IllegalStateException(
                    "GOOGLE_REDIRECT_URI must be set! " +
                            "This should match the URI configured in Google Cloud Console.");
        }

        if (!redirectUri.endsWith("/")) {
            log.warn("Redirect URI does not end with '/'. " +
                             "Google OAuth requires EXACT match including trailing slash!");
        }

        if (scopes == null || scopes.isEmpty()) {
            throw new IllegalStateException(
                    "google.oauth.scopes must be set! " +
                            "Example: https://www.googleapis.com/auth/calendar.events");
        }

        log.info("Google OAuth configuration validated successfully");
        log.info("Redirect URI: {}", redirectUri);
        log.debug("Scopes: {}", scopes);
    }

    public boolean isConfigured() {
        return clientId != null && !clientId.isEmpty()
                && clientSecret != null && !clientSecret.isEmpty()
                && redirectUri != null && !redirectUri.isEmpty();
    }
}