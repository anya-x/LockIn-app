package com.lockin.lockin_app.security;

import lombok.extern.slf4j.Slf4j;
import org.jasypt.util.text.AES256TextEncryptor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Slf4j
@Service
public class TokenEncryptionService {

    private final AES256TextEncryptor encryptor;

    public TokenEncryptionService(
            @Value("${token.encryption.secret}") String encryptionSecret) {

        if (encryptionSecret == null || encryptionSecret.length() < 32) {
            throw new IllegalStateException(
                    "TOKEN_ENCRYPTION_SECRET must be at least 32 characters! " +
                            "Current length: " + (encryptionSecret != null ? encryptionSecret.length() : 0)
            );
        }

        this.encryptor = new AES256TextEncryptor();
        this.encryptor.setPassword(encryptionSecret);

        log.info("Token encryption service initialized with AES-256");
    }

    /**
     * Encrypts a token for secure storage in database.
     *
     * @param plainToken the plaintext token to encrypt
     * @return encrypted token string
     * @throws IllegalArgumentException if token is null or empty
     * @throws RuntimeException if encryption fails
     */
    public String encrypt(String plainToken) {
        if (plainToken == null || plainToken.isEmpty()) {
            throw new IllegalArgumentException("Cannot encrypt null/empty token");
        }

        try {
            String encrypted = encryptor.encrypt(plainToken);
            log.debug("Token encrypted successfully (length: {})", encrypted.length());
            return encrypted;
        } catch (Exception e) {
            log.error("Failed to encrypt token", e);
            throw new RuntimeException("Token encryption failed", e);
        }
    }

    /**
     * Decrypts a token from database storage.
     *
     * @param encryptedToken the encrypted token to decrypt
     * @return decrypted plaintext token
     * @throws IllegalArgumentException if encrypted token is null or empty
     * @throws RuntimeException if decryption fails
     */
    public String decrypt(String encryptedToken) {
        if (encryptedToken == null || encryptedToken.isEmpty()) {
            throw new IllegalArgumentException("Cannot decrypt null/empty token");
        }

        try {
            String decrypted = encryptor.decrypt(encryptedToken);
            log.debug("Token decrypted successfully");
            return decrypted;
        } catch (Exception e) {
            log.error("Failed to decrypt token - may be corrupted or wrong encryption key", e);
            throw new RuntimeException("Token decryption failed", e);
        }
    }
}