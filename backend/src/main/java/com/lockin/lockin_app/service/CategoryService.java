package com.lockin.lockin_app.service;

import com.lockin.lockin_app.entity.Category;
import com.lockin.lockin_app.entity.User;
import com.lockin.lockin_app.exception.DuplicateResourceException;
import com.lockin.lockin_app.exception.ResourceNotFoundException;
import com.lockin.lockin_app.exception.UnauthorizedException;
import com.lockin.lockin_app.repository.CategoryRepository;
import com.lockin.lockin_app.repository.TaskRepository;
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
    private final TaskRepository taskRepository;

    @Transactional(readOnly = true)
    public List<Category> getUserCategories(Long userId) {
        return categoryRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }

    /**
     * Creates a new category
     *
     * <p>Validates that category name is unique for this user
     *
     * @throws ResourceNotFoundException if duplicate name exists
     */
    @Transactional
    public Category createCategory(Long userId, Category category) {
        log.info("Creating category for user: {}", userId);

        User user =
                userRepository
                        .findById(userId)
                        .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        if (categoryRepository.existsByUserIdAndName(userId, category.getName())) {
            throw new DuplicateResourceException("Category", "name", category.getName());
        }

        category.setUser(user);
        Category saved = categoryRepository.save(category);

        log.info("Created category: {}", saved.getId());

        return saved;
    }

    /**
     * Updates a category
     *
     * <p>If name is changed, validates new name is unique.
     *
     * @param categoryId category id to update
     * @param updatedCategory
     * @param userId owner of category
     * @return returns updated category
     */
    @Transactional
    public Category updateCategory(Long categoryId, Long userId, Category updatedCategory) {
        log.info("Updating category: {} for user: {}", categoryId, userId);

        Category category =
                categoryRepository
                        .findById(categoryId)
                        .orElseThrow(
                                () -> new ResourceNotFoundException("Category", "id", categoryId));

        validateCategoryOwnership(category, userId);

        // check for duplicate name only if name is being changed
        if (!category.getName().equals(updatedCategory.getName())
                && categoryRepository.existsByUserIdAndName(userId, updatedCategory.getName())) {
            throw new DuplicateResourceException("Category", "name", updatedCategory.getName());
        }

        category.setName(updatedCategory.getName());
        category.setColor(updatedCategory.getColor());
        category.setIcon(updatedCategory.getIcon());

        Category saved = categoryRepository.save(category);

        log.info("Updated category: {}", saved.getId());

        return saved;
    }

    /** Deletes a category, associated tasks will have their category set to null */
    @Transactional
    public void deleteCategory(Long categoryId, Long userId) {
        log.info("Deleting category: {} for user: {}", categoryId, userId);

        Category category =
                categoryRepository
                        .findById(categoryId)
                        .orElseThrow(
                                () -> new ResourceNotFoundException("Category", "id", categoryId));

        validateCategoryOwnership(category, userId);

        // unlink tasks from this category using bulk update
        taskRepository.removeCategoryFromTasks(categoryId);

        categoryRepository.delete(category);

        log.info("Deleted category: {}", categoryId);
    }

    @Transactional(readOnly = true)
    public Category getCategoryForUser(Long categoryId, Long userId) {
        log.debug("Getting category: {} for user: {}", categoryId, userId);

        Category category =
                categoryRepository
                        .findById(categoryId)
                        .orElseThrow(
                                () -> new ResourceNotFoundException("Category", "id", categoryId));

        validateCategoryOwnership(category, userId);

        return category;
    }

    /** validates category ownership */
    private void validateCategoryOwnership(Category category, Long userId) {
        if (!category.getUser().getId().equals(userId)) {
            log.warn(
                    "User {} attempted to access category {} owned by user {}",
                    userId,
                    category.getId(),
                    category.getUser().getId());
            throw new UnauthorizedException("You do not have permission to access this category");
        }
    }
}
