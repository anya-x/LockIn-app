package com.lockin.lockin_app.features.categories.repository;

import com.lockin.lockin_app.features.categories.entity.Category;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CategoryRepository extends JpaRepository<Category, Long> {
    List<Category> findByUserIdOrderByCreatedAtDesc(Long userId);

    List<Category> findByUserIdOrderByNameAsc(Long userId);

    Optional<Category> findByUserIdAndName(Long userId, String name);

    boolean existsByUserIdAndName(Long userId, String name);

    Long countByUserId(Long userId);

    @Query("SELECT COUNT(t) FROM Task t WHERE t.category.id = :categoryId")
    Long countTasksByCategoryId(@Param("categoryId") Long categoryId);

    @Query(
            "SELECT c.id, COUNT(t) FROM Category c LEFT JOIN Task t ON t.category.id = c.id WHERE c.user.id = :userId GROUP BY c.id")
    List<Object[]> countTasksPerCategoryForUser(@Param("userId") Long userId);

    void deleteByUserId(Long userId);
}
