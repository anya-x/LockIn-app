package com.lockin.lockin_app.service;

import com.lockin.lockin_app.entity.User;
import com.lockin.lockin_app.repository.UserRepository;
import com.lockin.lockin_app.util.TestDataFactory;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private UserRepository userRepository;

    // BUG: Forgot to mock PasswordEncoder!
    // BUG: Forgot to mock JwtUtil!
    // BUG: Forgot to mock AuthenticationManager!
    // BUG: Forgot to mock UserService!

    @InjectMocks
    private AuthService authService;

    @Test
    void shouldRegisterUser() {
        // Arrange
        User testUser = TestDataFactory.createTestUser();

        when(userRepository.save(any(User.class))).thenReturn(testUser);

        // Act
        // RegisterRequestDTO registerRequest = new RegisterRequestDTO();
        // AuthResponseDTO response = authService.register(registerRequest);

        // This will fail - NullPointerException!
    }
}
