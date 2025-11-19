package com.lockin.lockin_app.features.categories.service;

import com.lockin.lockin_app.features.categories.dto.CategoryRequestDTO;
import com.lockin.lockin_app.features.categories.dto.CategoryResponseDTO;
import com.lockin.lockin_app.features.categories.entity.Category;
import com.lockin.lockin_app.entity.User;
import com.lockin.lockin_app.exception.ResourceNotFoundException;
import com.lockin.lockin_app.exception.UnauthorizedException;
import com.lockin.lockin_app.features.categories.repository.CategoryRepository;
import com.lockin.lockin_app.repository.TaskRepository;
import com.lockin.lockin_app.repository.UserRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class CategoryService {

    private final CategoryRepository categoryRepository;
    private final UserRepository userRepository;
    private final TaskRepository taskRepository;

    @Transactional(readOnly = true)
    public List<CategoryResponseDTO> getUserCategories(Long userId) {
        List<Category> categories = categoryRepository.findByUserIdOrderByCreatedAtDesc(userId);

        Map<Long, Long> taskCountsPerCategory = new HashMap<>();
        List<Object[]> counts = categoryRepository.countTasksPerCategoryForUser(userId);
        for (Object[] row : counts) {
            taskCountsPerCategory.put((Long) row[0], (Long) row[1]);
        }

        return categories.stream()
                .map(
                        category ->
                                CategoryResponseDTO.fromEntity(
                                        category,
                                        taskCountsPerCategory.getOrDefault(category.getId(), 0L)))
                .collect(Collectors.toList());
    }

    /**
     * Creates a new category
     *
     * <p>Validates that category name is unique for this user
     *
     * @throws ResourceNotFoundException if duplicate name exists
     */
    @Transactional
    public CategoryResponseDTO createCategory(Long userId, CategoryRequestDTO request) {
        log.info("Creating category for user: {}", userId);

        User user =
                userRepository
                        .findById(userId)
                        .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        if (categoryRepository.existsByUserIdAndName(userId, request.getName())) {
            throw new ResourceNotFoundException(
                    "Category with name '" + request.getName() + "' already exists");
        }

        Category category = new Category();
        category.setName(request.getName());
        category.setColor(request.getColor());
        category.setIcon(request.getIcon());
        category.setUser(user);

        Category saved = categoryRepository.save(category);

        log.info("Created category: {}", saved.getId());

        Long taskCount = categoryRepository.countTasksByCategoryId(saved.getId());

        return CategoryResponseDTO.fromEntity(saved, taskCount);
    }

    /**
     * Updates a category
     *
     * <p>If name is changed, validates new name is unique.
     *
     * @param categoryId category id to update
     * @param request DTO containing updated fields
     * @param userId owner of category
     * @return returns updated category as DTO
     */
    @Transactional
    public CategoryResponseDTO updateCategory(
            Long categoryId, Long userId, CategoryRequestDTO request) {
        log.info("Updating category: {} for user: {}", categoryId, userId);

        Category category =
                categoryRepository
                        .findById(categoryId)
                        .orElseThrow(
                                () -> new ResourceNotFoundException("Category", "id", categoryId));

        validateCategoryOwnership(category, userId);

        if (!category.getName().equals(request.getName())
                && categoryRepository.existsByUserIdAndName(userId, request.getName())) {
            throw new ResourceNotFoundException(
                    "Category with name '" + request.getName() + "' already exists");
        }

        category.setName(request.getName());
        category.setColor(request.getColor());
        category.setIcon(request.getIcon());

        Category saved = categoryRepository.save(category);

        log.info("Updated category: {}", saved.getId());

        Long taskCount = categoryRepository.countTasksByCategoryId(saved.getId());

        return CategoryResponseDTO.fromEntity(saved, taskCount);
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
    public CategoryResponseDTO getCategoryForUser(Long categoryId, Long userId) {
        log.debug("Getting category: {} for user: {}", categoryId, userId);

        Category category =
                categoryRepository
                        .findById(categoryId)
                        .orElseThrow(
                                () -> new ResourceNotFoundException("Category", "id", categoryId));

        validateCategoryOwnership(category, userId);

        Long taskCount = categoryRepository.countTasksByCategoryId(categoryId);

        return CategoryResponseDTO.fromEntity(category, taskCount);
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

    /**
     * Gets category entity for user
     *
     * @param categoryId category id
     * @param userId user id
     * @return category entity
     * @throws ResourceNotFoundException if category not found
     * @throws UnauthorizedException if user doesn't own the category
     */
    @Transactional(readOnly = true)
    public Category getCategoryEntityForUser(Long categoryId, Long userId) {

        log.debug("Getting category entity: {} for user: {}", categoryId, userId);

        Category category =
                categoryRepository
                        .findById(categoryId)
                        .orElseThrow(
                                () -> new ResourceNotFoundException("Category", "id", categoryId));

        validateCategoryOwnership(category, userId);

        return category;
    }
}
