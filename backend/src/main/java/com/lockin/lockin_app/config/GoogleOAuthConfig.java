package com.lockin.lockin_app.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Data
@Configuration
@ConfigurationProperties(prefix = "google.oauth")
public class GoogleOAuthConfig {

    private String clientId;
    private String clientSecret;
    private String redirectUri;
    private String scopes;
}