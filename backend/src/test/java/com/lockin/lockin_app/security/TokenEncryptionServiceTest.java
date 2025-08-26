package com.lockin.lockin_app.security;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.TestPropertySource;

import static org.junit.jupiter.api.Assertions.*;
@SpringBootTest
class TokenEncryptionServiceTest {

    @Autowired
    private TokenEncryptionService encryptionService;

    @Test
    void testEncryptDecrypt() {
        String token = "ya29.a0AfH6SMBx...";

        String encrypted = encryptionService.encrypt(token);
        assertNotNull(encrypted);
        assertNotEquals(token, encrypted);

        String decrypted = encryptionService.decrypt(encrypted);
        assertEquals(token, decrypted);
    }
}