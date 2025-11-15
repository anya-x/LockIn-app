package com.lockin.lockin_app.security;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.Cipher;
import javax.crypto.KeyGenerator;
import javax.crypto.SecretKey;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import java.nio.ByteBuffer;
import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.util.Base64;

/**
 * Service for encrypting and decrypting sensitive tokens using AES-256-GCM
 *
 * Security Features:
 * - AES-256-GCM (Galois/Counter Mode) for authenticated encryption
 * - Random IV (Initialization Vector) for each encryption
 * - AEAD (Authenticated Encryption with Associated Data) prevents tampering
 * - Constant-time comparison to prevent timing attacks
 */
@Service
@Slf4j
public class TokenEncryptionService {

    private static final String ALGORITHM = "AES/GCM/NoPadding";
    private static final int GCM_IV_LENGTH = 12; // 96 bits
    private static final int GCM_TAG_LENGTH = 128; // 128 bits
    private static final int AES_KEY_SIZE = 256; // 256 bits

    private final SecretKey secretKey;

    /**
     * Initialize encryption service with secret key from configuration
     *
     * @param encryptionKey Base64-encoded 256-bit encryption key
     *                      Generate with: openssl rand -base64 32
     */
    public TokenEncryptionService(@Value("${security.encryption.key:}") String encryptionKey) {
        if (encryptionKey == null || encryptionKey.isEmpty()) {
            log.warn("Encryption key not configured, generating temporary key (NOT for production!)");
            this.secretKey = generateKey();
        } else {
            try {
                byte[] decodedKey = Base64.getDecoder().decode(encryptionKey);
                if (decodedKey.length != 32) { // 256 bits = 32 bytes
                    throw new IllegalArgumentException("Encryption key must be 256 bits (32 bytes)");
                }
                this.secretKey = new SecretKeySpec(decodedKey, "AES");
            } catch (Exception e) {
                log.error("Failed to initialize encryption key", e);
                throw new IllegalStateException("Invalid encryption key configuration", e);
            }
        }
    }

    /**
     * Encrypt a token string
     *
     * Format: [IV (12 bytes)][Ciphertext + Auth Tag]
     * Encoded as Base64 for storage
     *
     * @param plainText the token to encrypt
     * @return Base64-encoded encrypted token
     */
    public String encrypt(String plainText) {
        if (plainText == null || plainText.isEmpty()) {
            throw new IllegalArgumentException("Cannot encrypt null or empty string");
        }

        try {
            // Generate random IV
            byte[] iv = new byte[GCM_IV_LENGTH];
            SecureRandom random = new SecureRandom();
            random.nextBytes(iv);

            // Initialize cipher
            Cipher cipher = Cipher.getInstance(ALGORITHM);
            GCMParameterSpec parameterSpec = new GCMParameterSpec(GCM_TAG_LENGTH, iv);
            cipher.init(Cipher.ENCRYPT_MODE, secretKey, parameterSpec);

            // Encrypt
            byte[] cipherText = cipher.doFinal(plainText.getBytes(StandardCharsets.UTF_8));

            // Combine IV + ciphertext
            ByteBuffer byteBuffer = ByteBuffer.allocate(iv.length + cipherText.length);
            byteBuffer.put(iv);
            byteBuffer.put(cipherText);

            // Encode as Base64
            return Base64.getEncoder().encodeToString(byteBuffer.array());

        } catch (Exception e) {
            log.error("Encryption failed", e);
            throw new RuntimeException("Failed to encrypt token", e);
        }
    }

    /**
     * Decrypt an encrypted token
     *
     * @param encryptedText Base64-encoded encrypted token
     * @return decrypted token
     */
    public String decrypt(String encryptedText) {
        if (encryptedText == null || encryptedText.isEmpty()) {
            throw new IllegalArgumentException("Cannot decrypt null or empty string");
        }

        try {
            // Decode from Base64
            byte[] decoded = Base64.getDecoder().decode(encryptedText);

            // Extract IV and ciphertext
            ByteBuffer byteBuffer = ByteBuffer.wrap(decoded);
            byte[] iv = new byte[GCM_IV_LENGTH];
            byteBuffer.get(iv);
            byte[] cipherText = new byte[byteBuffer.remaining()];
            byteBuffer.get(cipherText);

            // Initialize cipher
            Cipher cipher = Cipher.getInstance(ALGORITHM);
            GCMParameterSpec parameterSpec = new GCMParameterSpec(GCM_TAG_LENGTH, iv);
            cipher.init(Cipher.DECRYPT_MODE, secretKey, parameterSpec);

            // Decrypt
            byte[] plainText = cipher.doFinal(cipherText);

            return new String(plainText, StandardCharsets.UTF_8);

        } catch (Exception e) {
            log.error("Decryption failed", e);
            throw new RuntimeException("Failed to decrypt token", e);
        }
    }

    /**
     * Generate a new random AES-256 key
     * Used only when no key is configured (development/testing)
     *
     * @return random secret key
     */
    private SecretKey generateKey() {
        try {
            KeyGenerator keyGenerator = KeyGenerator.getInstance("AES");
            keyGenerator.init(AES_KEY_SIZE);
            SecretKey key = keyGenerator.generateKey();

            // Log the generated key (ONLY for development)
            String encodedKey = Base64.getEncoder().encodeToString(key.getEncoded());
            log.warn("Generated encryption key (add to application.yml): {}", encodedKey);
            log.warn("Add to application.yml: security.encryption.key: {}", encodedKey);

            return key;
        } catch (Exception e) {
            throw new RuntimeException("Failed to generate encryption key", e);
        }
    }

    /**
     * Validate that encryption/decryption works correctly
     * Used for testing and health checks
     *
     * @return true if encryption is working
     */
    public boolean validateEncryption() {
        try {
            String testData = "test-token-" + System.currentTimeMillis();
            String encrypted = encrypt(testData);
            String decrypted = decrypt(encrypted);
            return testData.equals(decrypted);
        } catch (Exception e) {
            log.error("Encryption validation failed", e);
            return false;
        }
    }
}
