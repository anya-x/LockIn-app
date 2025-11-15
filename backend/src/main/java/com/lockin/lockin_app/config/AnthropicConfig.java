package com.lockin.lockin_app.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

/**
 * Configuration properties for Anthropic Claude API.
 *
 * Loads from environment variables via application.properties.
 */
@Data
@Configuration
@ConfigurationProperties(prefix = "anthropic.api")
public class AnthropicConfig {

    /**
     * API key for Anthropic (should be in .env file)
     */
    private String key;

    /**
     * API endpoint URL
     */
    private String url = "https://api.anthropic.com/v1/messages";

    /**
     * Model to use (claude-3-5-sonnet-20241022 recommended)
     */
    private String model = "claude-3-5-sonnet-20241022";

    /**
     * Maximum tokens in response (controls cost)
     */
    private Integer maxTokens = 1000;

    /**
     * Temperature for response randomness (0.0 = deterministic, 1.0 = creative)
     */
    private Double temperature = 0.7;

    /**
     * Validate that API key is present.
     * Called by Spring after properties are loaded.
     */
    @javax.annotation.PostConstruct
    public void validate() {
        if (key == null || key.isEmpty() || key.equals("your-key-here")) {
            throw new IllegalStateException(
                "ANTHROPIC_API_KEY must be set in .env file! " +
                "Get your key from https://console.anthropic.com"
            );
        }
    }
}
