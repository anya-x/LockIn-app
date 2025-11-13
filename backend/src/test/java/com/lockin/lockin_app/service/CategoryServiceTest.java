package com.lockin.lockin_app.service;

import com.lockin.lockin_app.dto.CategoryRequestDTO;
import com.lockin.lockin_app.dto.CategoryResponseDTO;
import com.lockin.lockin_app.entity.Category;
import com.lockin.lockin_app.entity.User;
import com.lockin.lockin_app.repository.CategoryRepository;
import com.lockin.lockin_app.util.TestDataFactory;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("CategoryService Unit Tests")
class CategoryServiceTest {

    @Mock
    private CategoryRepository categoryRepository;

    @Mock
    private UserService userService;

    @InjectMocks
    private CategoryService categoryService;

    private User testUser;
    private Category testCategory;

    @BeforeEach
    void setUp() {
        testUser = TestDataFactory.createTestUser();
        testCategory = TestDataFactory.createTestCategory(testUser, "Work");
    }

    @Test
    @DisplayName("Should create category successfully")
    void shouldCreateCategory() {
        // Arrange
        CategoryRequestDTO request = new CategoryRequestDTO();
        request.setName("Personal");
        request.setColor("#4CAF50");

        when(userService.getUserById(1L)).thenReturn(testUser);
        when(categoryRepository.save(any(Category.class))).thenReturn(testCategory);

        // Act
        CategoryResponseDTO response = categoryService.createCategory(1L, request);

        // Assert
        assertThat(response).isNotNull();
        verify(categoryRepository).save(any(Category.class));
    }

    @Test
    @DisplayName("Should get all categories for user")
    void shouldGetAllCategories() {
        // Arrange
        Category cat1 = TestDataFactory.createTestCategory(testUser, "Work");
        Category cat2 = TestDataFactory.createTestCategory(testUser, "Personal");
        when(userService.getUserById(1L)).thenReturn(testUser);
        when(categoryRepository.findByUser(testUser)).thenReturn(Arrays.asList(cat1, cat2));

        // Act
        List<CategoryResponseDTO> categories = categoryService.getUserCategories(1L);

        // Assert
        assertThat(categories).hasSize(2);
    }

    @Test
    @DisplayName("Should delete category")
    void shouldDeleteCategory() {
        // Arrange
        when(categoryRepository.findById(1L)).thenReturn(Optional.of(testCategory));
        doNothing().when(categoryRepository).delete(testCategory);

        // Act
        categoryService.deleteCategory(testUser.getId(), 1L);

        // Assert
        verify(categoryRepository).delete(testCategory);
    }
}
