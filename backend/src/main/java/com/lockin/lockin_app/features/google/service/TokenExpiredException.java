package com.lockin.lockin_app.features.google.service;

/**
 * Exception thrown when a Google Calendar access token has expired
 * and cannot be automatically refreshed.
 *
 * User needs to manually reconnect their calendar.
 */
public class TokenExpiredException extends RuntimeException {
    public TokenExpiredException(String message) {
        super(message);
    }
}
