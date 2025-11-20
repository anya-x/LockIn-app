package com.lockin.lockin_app.security;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.TestPropertySource;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Test class for TokenEncryptionService.
 *
 * Tests encryption and decryption functionality.
 */
@SpringBootTest
@TestPropertySource(properties = {
    "token.encryption.secret=this-is-a-test-secret-key-that-is-at-least-32-characters-long"
})
class TokenEncryptionServiceTest {

    @Autowired
    private TokenEncryptionService encryptionService;

    private String testToken;

    @BeforeEach
    void setUp() {
        // Simulate a real OAuth token (fake for testing)
        testToken = "ya29.a0AfH6SMBx1234567890abcdefghijklmnopqrstuvwxyz";
    }

    /**
     * Test that encryption produces a different string than the original.
     */
    @Test
    void testEncrypt_shouldReturnDifferentValue() {
        String encrypted = encryptionService.encrypt(testToken);

        assertNotNull(encrypted, "Encrypted token should not be null");
        assertNotEquals(testToken, encrypted, "Encrypted token should be different from original");
        assertTrue(encrypted.length() > 0, "Encrypted token should have content");
    }

    /**
     * Test that decryption returns the original token.
     */
    @Test
    void testEncryptDecrypt_shouldReturnOriginalValue() {
        String encrypted = encryptionService.encrypt(testToken);
        String decrypted = encryptionService.decrypt(encrypted);

        assertEquals(testToken, decrypted, "Decrypted token should match original");
    }

    /**
     * Test that encrypting null token throws exception.
     */
    @Test
    void testEncrypt_withNullToken_shouldThrowException() {
        assertThrows(IllegalArgumentException.class, () -> {
            encryptionService.encrypt(null);
        }, "Encrypting null should throw IllegalArgumentException");
    }

    /**
     * Test that encrypting empty token throws exception.
     */
    @Test
    void testEncrypt_withEmptyToken_shouldThrowException() {
        assertThrows(IllegalArgumentException.class, () -> {
            encryptionService.encrypt("");
        }, "Encrypting empty string should throw IllegalArgumentException");
    }

    /**
     * Test that decrypting null token throws exception.
     */
    @Test
    void testDecrypt_withNullToken_shouldThrowException() {
        assertThrows(IllegalArgumentException.class, () -> {
            encryptionService.decrypt(null);
        }, "Decrypting null should throw IllegalArgumentException");
    }

    /**
     * Test that decrypting empty token throws exception.
     */
    @Test
    void testDecrypt_withEmptyToken_shouldThrowException() {
        assertThrows(IllegalArgumentException.class, () -> {
            encryptionService.decrypt("");
        }, "Decrypting empty string should throw IllegalArgumentException");
    }

    /**
     * Test that decrypting invalid encrypted data throws exception.
     */
    @Test
    void testDecrypt_withInvalidData_shouldThrowException() {
        assertThrows(RuntimeException.class, () -> {
            encryptionService.decrypt("invalid-encrypted-data");
        }, "Decrypting invalid data should throw RuntimeException");
    }

    /**
     * Test that same token encrypts to different values each time.
     * (AES encryption should produce different ciphertext each time)
     */
    @Test
    void testEncrypt_sameTokenTwice_shouldProduceDifferentValues() {
        String encrypted1 = encryptionService.encrypt(testToken);
        String encrypted2 = encryptionService.encrypt(testToken);

        assertNotEquals(encrypted1, encrypted2,
            "Encrypting same token twice should produce different ciphertext (due to IV)");

        // But both should decrypt to the same value
        String decrypted1 = encryptionService.decrypt(encrypted1);
        String decrypted2 = encryptionService.decrypt(encrypted2);

        assertEquals(testToken, decrypted1);
        assertEquals(testToken, decrypted2);
    }
}
