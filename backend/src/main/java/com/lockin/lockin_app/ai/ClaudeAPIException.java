package com.lockin.lockin_app.ai;

/**
 * Exception thrown when Claude API calls fail.
 */
public class ClaudeAPIException extends RuntimeException {

    public ClaudeAPIException(String message) {
        super(message);
    }

    public ClaudeAPIException(String message, Throwable cause) {
        super(message, cause);
    }
}
