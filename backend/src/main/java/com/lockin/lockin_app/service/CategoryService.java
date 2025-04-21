package com.lockin.lockin_app.service;

import com.lockin.lockin_app.entity.Category;
import com.lockin.lockin_app.entity.Task;
import com.lockin.lockin_app.entity.User;
import com.lockin.lockin_app.repository.CategoryRepository;
import com.lockin.lockin_app.repository.UserRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class CategoryService {

    private final CategoryRepository categoryRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public List<Category> getUserCategories(Long userId) {
        return categoryRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }

    @Transactional
    public Category createCategory(Long userId, Category category) {
        log.info("Creating category for: {}", userId);
        User user =
                userRepository
                        .findById(userId)
                        .orElseThrow(() -> new RuntimeException("User not found"));

        if (categoryRepository.existsByUserIdAndName(userId, category.getName())) {
            throw new RuntimeException("Category with this name already exists");
        }

        category.setUser(user);
        Category saved = categoryRepository.save(category);

        log.info("Created task: {}", category.getId());

        return saved;
    }

    @Transactional
    public Category updateCategory(Long categoryId, Long userId, Category updatedCategory) {
        log.info("Updating category: {} for user: {}", categoryId, userId);

        Category category =
                categoryRepository
                        .findById(categoryId)
                        .orElseThrow(() -> new RuntimeException("Category not found"));

        if (!category.getUser().getId().equals(userId)) {
            throw new RuntimeException("Unauthorised");
        }

        if (!category.getName().equals(updatedCategory.getName())
                && categoryRepository.existsByUserIdAndName(userId, updatedCategory.getName())) {
            throw new RuntimeException("Category with this name already exists");
        }

        category.setName(updatedCategory.getName());
        category.setColor(updatedCategory.getColor());
        category.setIcon(updatedCategory.getIcon());

        Category saved = categoryRepository.save(category);

        log.info("Updated categor");

        return saved;
    }

    @Transactional
    public void deleteCategory(Long categoryId, Long userId) {
        log.info("Deleting category: {} for user: {}", categoryId, userId);

        Category category =
                categoryRepository
                        .findById(categoryId)
                        .orElseThrow(() -> new RuntimeException("Category not found"));

        if (!category.getUser().getId().equals(userId)) {
            throw new RuntimeException("Unauthorised");
        }

        for (Task task : category.getTasks()) {
            task.setCategory(null);
        }

        categoryRepository.delete(category);

        log.info("Category deleted");
    }

    @Transactional(readOnly = true)
    public Category getCategoryForUser(Long categoryId, Long userId) {
        log.debug("Getting category: {} for user: {}", categoryId, userId);

        Category category =
                categoryRepository
                        .findById(categoryId)
                        .orElseThrow(() -> new RuntimeException("Category not found"));

        if (!category.getUser().getId().equals(userId)) {
            throw new RuntimeException("Category does not belong to user");
        }

        return category;
    }
}
