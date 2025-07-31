package com.lockin.lockin_app.config;

import jakarta.annotation.PostConstruct;

import lombok.Data;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Data
@Configuration
@ConfigurationProperties(prefix = "anthropic.api")
public class AnthropicConfig {

    private String key;

    private String url = "https://api.anthropic.com/v1/messages";

    private String model = "claude-sonnet-4-20250514";

    private Integer maxTokens = 1000;

    private Double temperature = 0.7;

    @PostConstruct
    public void validate() {
        if (key == null || key.isEmpty() || key.equals("your-key-here")) {
            throw new IllegalStateException(
                    "ANTHROPIC_API_KEY must be set in .env file! "
                            + "Get your key from https://console.anthropic.com");
        }
    }
}
