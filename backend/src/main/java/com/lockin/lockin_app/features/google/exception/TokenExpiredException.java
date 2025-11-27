package com.lockin.lockin_app.features.google.exception;

/**
 * Exception thrown when OAuth access token has expired.
 *
 * Decision: We don't attempt automatic refresh because it's unreliable.
 * Better UX to show clear "reconnect" button to user.
 */
public class TokenExpiredException extends RuntimeException {

    public TokenExpiredException(String message) {
        super(message);
    }

    public TokenExpiredException(String message, Throwable cause) {
        super(message, cause);
    }
}
