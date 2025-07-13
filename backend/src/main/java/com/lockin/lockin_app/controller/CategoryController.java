package com.lockin.lockin_app.controller;

import com.lockin.lockin_app.dto.CategoryRequestDTO;
import com.lockin.lockin_app.dto.CategoryResponseDTO;
import com.lockin.lockin_app.entity.Category;
import com.lockin.lockin_app.repository.CategoryRepository;
import com.lockin.lockin_app.service.CategoryService;
import com.lockin.lockin_app.service.UserService;

import jakarta.validation.Valid;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@RestController
@RequestMapping("/api/categories")
@RequiredArgsConstructor
public class CategoryController {

    private final CategoryService categoryService;
    private final UserService userService;
    private final CategoryRepository categoryRepository;

    @GetMapping
    public ResponseEntity<List<CategoryResponseDTO>> getAllCategories(
            @AuthenticationPrincipal UserDetails userDetails) {

        log.debug("GET /api/categries: User: {}", userDetails.getUsername());

        Long userId = userService.getUserIdFromEmail(userDetails.getUsername());
        List<Category> categories = categoryService.getUserCategories(userId);

        Map<Long, Long> taskCountsPerCategory = new HashMap<>();
        List<Object[]> counts = categoryRepository.countTasksPerCategoryForUser(userId);
        for (Object[] row : counts) {
            taskCountsPerCategory.put((Long) row[0], (Long) row[1]);
        }

        List<CategoryResponseDTO> response =
                categories.stream()
                        .map(
                                category ->
                                        CategoryResponseDTO.fromEntity(
                                                category,
                                                taskCountsPerCategory.getOrDefault(
                                                        category.getId(), 0L)))
                        .collect(Collectors.toList());

        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}")
    public ResponseEntity<CategoryResponseDTO> getCategoryById(
            @PathVariable Long id, @AuthenticationPrincipal UserDetails userDetails) {

        log.debug("GET /api/categories/{} : User: {}", id, userDetails.getUsername());

        Long userId = userService.getUserIdFromEmail(userDetails.getUsername());
        Category category = categoryService.getCategoryForUser(id, userId);

        return ResponseEntity.ok(
                CategoryResponseDTO.fromEntity(
                        category, categoryRepository.countTasksByCategoryId(category.getId())));
    }

    @PostMapping
    public ResponseEntity<CategoryResponseDTO> createCategory(
            @Valid @RequestBody CategoryRequestDTO request,
            @AuthenticationPrincipal UserDetails userDetails) {

        log.debug(
                "POST /api/categries: User: {} Category: {}",
                userDetails.getUsername(),
                request.getName());

        Long userId = userService.getUserIdFromEmail(userDetails.getUsername());

        Category category = new Category();
        category.setName(request.getName());
        category.setColor(request.getColor());
        category.setIcon(request.getIcon());

        Category created = categoryService.createCategory(userId, category);

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(
                        CategoryResponseDTO.fromEntity(
                                created,
                                categoryRepository.countTasksByCategoryId(created.getId())));
    }

    @PutMapping("/{id}")
    public ResponseEntity<CategoryResponseDTO> updateCategory(
            @PathVariable Long id,
            @Valid @RequestBody CategoryRequestDTO request,
            @AuthenticationPrincipal UserDetails userDetails) {

        log.debug(
                "PUT /api/categries/{}: User: {} Category: {}",
                id,
                userDetails.getUsername(),
                request.getName());

        Long userId = userService.getUserIdFromEmail(userDetails.getUsername());

        Category updatedCategory = new Category();
        updatedCategory.setName(request.getName());
        updatedCategory.setColor(request.getColor());
        updatedCategory.setIcon(request.getIcon());

        Category updated = categoryService.updateCategory(id, userId, updatedCategory);

        return ResponseEntity.ok(
                CategoryResponseDTO.fromEntity(
                        updated, categoryRepository.countTasksByCategoryId(updated.getId())));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteCategory(
            @PathVariable Long id, @AuthenticationPrincipal UserDetails userDetails) {

        log.debug("DELETE /api/categries/ Category: {}", id);

        Long userId = userService.getUserIdFromEmail(userDetails.getUsername());
        categoryService.deleteCategory(id, userId);

        return ResponseEntity.noContent().build();
    }
}
