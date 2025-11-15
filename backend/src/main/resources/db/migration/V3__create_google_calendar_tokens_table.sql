-- Create Google Calendar OAuth2 tokens table
CREATE TABLE google_calendar_tokens (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL UNIQUE,
    encrypted_access_token VARCHAR(1000) NOT NULL,
    encrypted_refresh_token VARCHAR(1000),
    token_expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    scope VARCHAR(500),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    connected_at TIMESTAMP WITH TIME ZONE,
    last_sync_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_calendar_token_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);

-- Index for faster user lookup
CREATE INDEX idx_calendar_tokens_user_id ON google_calendar_tokens(user_id);

-- Index for finding expired tokens
CREATE INDEX idx_calendar_tokens_expires_at ON google_calendar_tokens(token_expires_at);

-- Index for active tokens
CREATE INDEX idx_calendar_tokens_is_active ON google_calendar_tokens(is_active);

-- Comments for documentation
COMMENT ON TABLE google_calendar_tokens IS 'Stores encrypted Google Calendar OAuth2 tokens for calendar integration';
COMMENT ON COLUMN google_calendar_tokens.encrypted_access_token IS 'AES-256-GCM encrypted access token';
COMMENT ON COLUMN google_calendar_tokens.encrypted_refresh_token IS 'AES-256-GCM encrypted refresh token';
COMMENT ON COLUMN google_calendar_tokens.token_expires_at IS 'Token expiry timestamp for automatic refresh';
COMMENT ON COLUMN google_calendar_tokens.scope IS 'OAuth2 scopes granted by user';
COMMENT ON COLUMN google_calendar_tokens.is_active IS 'Whether the calendar connection is currently active';
COMMENT ON COLUMN google_calendar_tokens.connected_at IS 'When the user first connected their calendar';
COMMENT ON COLUMN google_calendar_tokens.last_sync_at IS 'When the calendar was last successfully synced';
