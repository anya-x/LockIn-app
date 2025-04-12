package com.lockin.lockin_app.controller;

import com.lockin.lockin_app.entity.Category;
import com.lockin.lockin_app.service.CategoryService;
import com.lockin.lockin_app.service.UserService;

import jakarta.validation.Valid;

import lombok.RequiredArgsConstructor;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/categories")
@RequiredArgsConstructor
public class CategoryController {

    private final CategoryService categoryService;
    private final UserService userService;

    @GetMapping
    public ResponseEntity<List<Category>> getCategories(
            @AuthenticationPrincipal UserDetails userDetails) {

        Long userId = userService.getUserIdFromEmail(userDetails.getUsername());
        List<Category> categories = categoryService.getUserCategories(userId);
        return ResponseEntity.ok(categories);
    }

    @PostMapping
    public ResponseEntity<Category> createCategory(
            @Valid @RequestBody Category category,
            @AuthenticationPrincipal UserDetails userDetails) {

        Long userId = userService.getUserIdFromEmail(userDetails.getUsername());
        Category created = categoryService.createCategory(userId, category);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Category> updateCategory(
            @PathVariable Long id,
            @Valid @RequestBody Category category,
            @AuthenticationPrincipal UserDetails userDetails) {

        Long userId = userService.getUserIdFromEmail(userDetails.getUsername());
        Category updated = categoryService.updateCategory(id, userId, category);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteCategory(
            @PathVariable Long id, @AuthenticationPrincipal UserDetails userDetails) {

        Long userId = userService.getUserIdFromEmail(userDetails.getUsername());
        categoryService.deleteCategory(id, userId);
        return ResponseEntity.noContent().build();
    }
}
