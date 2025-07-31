package com.lockin.lockin_app.exception;


public class ClaudeAPIException extends RuntimeException {

    public ClaudeAPIException(String message) {
        super(message);
    }

    public ClaudeAPIException(String message, Throwable cause) {
        super(message, cause);
    }
}
