package com.lockin.lockin_app.controller;

import com.lockin.lockin_app.dto.CategoryRequestDTO;
import com.lockin.lockin_app.dto.CategoryResponseDTO;
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

import java.util.List;

@Slf4j
@RestController
@RequestMapping("/api/categories")
public class CategoryController extends BaseController {

    private final CategoryService categoryService;

    public CategoryController(UserService userService, CategoryService categoryService) {
        super(userService);
        this.categoryService = categoryService;
    }

    @GetMapping
    public ResponseEntity<List<CategoryResponseDTO>> getAllCategories(
            @AuthenticationPrincipal UserDetails userDetails) {

        log.debug("GET /api/categories: User: {}", userDetails.getUsername());

        Long userId = getCurrentUserId(userDetails);
        List<CategoryResponseDTO> categories = categoryService.getUserCategories(userId);

        return ResponseEntity.ok(categories);
    }

    @GetMapping("/{id}")
    public ResponseEntity<CategoryResponseDTO> getCategoryById(
            @PathVariable Long id, @AuthenticationPrincipal UserDetails userDetails) {

        log.debug("GET /api/categories/{} : User: {}", id, userDetails.getUsername());

        Long userId = getCurrentUserId(userDetails);
        CategoryResponseDTO category = categoryService.getCategoryForUser(id, userId);

        return ResponseEntity.ok(category);
    }

    @PostMapping
    public ResponseEntity<CategoryResponseDTO> createCategory(
            @Valid @RequestBody CategoryRequestDTO request,
            @AuthenticationPrincipal UserDetails userDetails) {

        log.debug(
                "POST /api/categories: User: {} Category: {}",
                userDetails.getUsername(),
                request.getName());

        Long userId = getCurrentUserId(userDetails);
        CategoryResponseDTO created = categoryService.createCategory(userId, request);

        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/{id}")
    public ResponseEntity<CategoryResponseDTO> updateCategory(
            @PathVariable Long id,
            @Valid @RequestBody CategoryRequestDTO request,
            @AuthenticationPrincipal UserDetails userDetails) {

        log.debug(
                "PUT /api/categories/{}: User: {} Category: {}",
                id,
                userDetails.getUsername(),
                request.getName());

        Long userId = getCurrentUserId(userDetails);
        CategoryResponseDTO updated = categoryService.updateCategory(id, userId, request);

        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteCategory(
            @PathVariable Long id, @AuthenticationPrincipal UserDetails userDetails) {

        log.debug("DELETE /api/categories/ Category: {}", id);

        Long userId = getCurrentUserId(userDetails);
        categoryService.deleteCategory(id, userId);

        return ResponseEntity.noContent().build();
    }
}
