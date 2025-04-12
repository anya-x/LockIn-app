package com.lockin.lockin_app.service;

import com.lockin.lockin_app.entity.Category;
import com.lockin.lockin_app.entity.User;
import com.lockin.lockin_app.repository.CategoryRepository;
import com.lockin.lockin_app.repository.UserRepository;

import lombok.RequiredArgsConstructor;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CategoryService {

    private final CategoryRepository categoryRepository;
    private final UserRepository userRepository;

    public List<Category> getUserCategories(Long userId) {
        return categoryRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }

    public Category createCategory(Long userId, Category category) {
        User user =
                userRepository
                        .findById(userId)
                        .orElseThrow(() -> new RuntimeException("User not found"));

        category.setUser(user);
        return categoryRepository.save(category);
    }

    public Category updateCategory(Long categoryId, Long userId, Category updatedCategory) {
        Category category =
                categoryRepository
                        .findById(categoryId)
                        .orElseThrow(() -> new RuntimeException("Category not found"));

        if (!category.getUser().getId().equals(userId)) {
            throw new RuntimeException("Unauthorised");
        }

        category.setName(updatedCategory.getName());
        category.setColor(updatedCategory.getColor());
        category.setIcon(updatedCategory.getIcon());

        return categoryRepository.save(category);
    }

    @Transactional
    public void deleteCategory(Long categoryId, Long userId) {
        Category category =
                categoryRepository
                        .findById(categoryId)
                        .orElseThrow(() -> new RuntimeException("Category not found"));

        if (!category.getUser().getId().equals(userId)) {
            throw new RuntimeException("Unauthorised");
        }

        categoryRepository.delete(category);
    }
}
