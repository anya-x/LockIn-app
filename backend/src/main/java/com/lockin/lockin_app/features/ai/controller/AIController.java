package com.lockin.lockin_app.features.ai.controller;

import com.lockin.lockin_app.features.ai.dto.BriefingResultDTO;
import com.lockin.lockin_app.features.ai.dto.EnhancementResultDTO;
import com.lockin.lockin_app.features.ai.dto.RateLimitStatusDTO;
import com.lockin.lockin_app.features.ai.dto.TaskBreakdownRequestDTO;
import com.lockin.lockin_app.features.ai.dto.TaskBreakdownResultDTO;
import com.lockin.lockin_app.features.ai.service.DailyBriefingService;
import com.lockin.lockin_app.features.ai.service.DescriptionEnhancementService;
import com.lockin.lockin_app.features.ai.service.RateLimitService;
import com.lockin.lockin_app.features.ai.service.TaskBreakdownService;
import com.lockin.lockin_app.features.tasks.entity.Task;
import com.lockin.lockin_app.features.tasks.service.TaskService;
import com.lockin.lockin_app.features.users.entity.User;

import com.lockin.lockin_app.features.users.service.UserService;
import com.lockin.lockin_app.shared.controller.BaseController;
import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;


@Slf4j
@RestController
@RequestMapping("/api/ai")
public class AIController extends BaseController {

    private final TaskBreakdownService taskBreakdownService;
    private final TaskService taskService;
    private final DescriptionEnhancementService descriptionEnhancementService;
    private final DailyBriefingService dailyBriefingService;
    private final RateLimitService rateLimitService;

    public AIController(
            UserService userService,
            TaskBreakdownService taskBreakdownService,
            TaskService taskService,
            DescriptionEnhancementService descriptionEnhancementService,
            DailyBriefingService dailyBriefingService,
            RateLimitService rateLimitService) {
        super(userService);
        this.taskBreakdownService = taskBreakdownService;
        this.taskService = taskService;
        this.descriptionEnhancementService = descriptionEnhancementService;
        this.dailyBriefingService = dailyBriefingService;
        this.rateLimitService = rateLimitService;
    }

    @PostMapping("/breakdown/{taskId}")
    public ResponseEntity<TaskBreakdownResultDTO> breakdownTask(
            @PathVariable Long taskId,
            @AuthenticationPrincipal UserDetails userDetails) {

        log.info("AI breakdown requested for task {} by user {}", taskId, getCurrentUserEmail(userDetails));

        Long userId = getCurrentUserId(userDetails);
        Task task = taskService.getTaskEntity(taskId, userId);

        try {
            TaskBreakdownResultDTO result = taskBreakdownService.breakdownTask(
                    task.getTitle(),
                    task.getDescription(),
                    task.getDueDate(),
                    userId
            );

            log.info("AI breakdown successful: {} subtasks, ${} cost",
                     result.getSubtasks().size(),
                     String.format("%.4f", result.getCostUSD()));

            return ResponseEntity.ok(result);

        } catch (IllegalArgumentException e) {
            log.error("Invalid request: {}", e.getMessage());
            throw e;
        } catch (Exception e) {
            log.error("AI breakdown failed: {}", e.getMessage());
            throw new RuntimeException("AI task breakdown failed: " + e.getMessage(), e);
        }
    }

    @PostMapping("/breakdown-preview")
    public ResponseEntity<TaskBreakdownResultDTO> breakdownPreview(
            @Valid @RequestBody TaskBreakdownRequestDTO request,
            @AuthenticationPrincipal UserDetails userDetails) {

        log.info("AI breakdown preview requested by user {} for task: {}",
                 getCurrentUserEmail(userDetails), request.getTitle());

        Long userId = getCurrentUserId(userDetails);
        Task tempTask = new Task();
        tempTask.setTitle(request.getTitle());
        tempTask.setDescription(request.getDescription());

        User user = userService.getUserById(userId);
        tempTask.setUser(user);

        try {
            TaskBreakdownResultDTO result = taskBreakdownService.breakdownTask(
                    request.getTitle(),
                    request.getDescription(),
                    null,
                    userId
            );

            log.info("AI breakdown preview successful: {} subtasks, ${} cost",
                     result.getSubtasks().size(),
                     String.format("%.4f", result.getCostUSD()));

            return ResponseEntity.ok(result);

        } catch (IllegalArgumentException e) {
            log.error("Invalid request: {}", e.getMessage());
            throw e;
        } catch (Exception e) {
            log.error("AI breakdown preview failed: {}", e.getMessage());
            throw new RuntimeException("AI task breakdown failed: " + e.getMessage(), e);
        }
    }

    @PostMapping("/enhance-description")
    public ResponseEntity<EnhancementResultDTO> enhanceDescription(
            @Valid @RequestBody TaskBreakdownRequestDTO request,
            @AuthenticationPrincipal UserDetails userDetails) {

        log.info("AI description enhancement requested by user {} for task: {}",
                 getCurrentUserEmail(userDetails), request.getTitle());

        Long userId = getCurrentUserId(userDetails);

        try {
            EnhancementResultDTO result =
                    descriptionEnhancementService.enhanceDescription(
                            request.getTitle(),
                            request.getDescription(),
                            userId
                    );

            log.info("AI description enhancement successful: {} tokens, ${} cost",
                     result.getTokensUsed(),
                     String.format("%.4f", result.getCostUSD()));

            return ResponseEntity.ok(result);

        } catch (IllegalArgumentException e) {
            log.error("Invalid request: {}", e.getMessage());
            throw e;
        } catch (Exception e) {
            log.error("AI description enhancement failed: {}", e.getMessage());
            throw new RuntimeException("AI description enhancement failed: " + e.getMessage(), e);
        }
    }

    @GetMapping("/daily-briefing")
    public ResponseEntity<BriefingResultDTO> getDailyBriefing(
            @AuthenticationPrincipal UserDetails userDetails) {
        log.info("Daily briefing requested by user: {}", getCurrentUserEmail(userDetails));

        Long userId = getCurrentUserId(userDetails);

        try {
            BriefingResultDTO result =
                    dailyBriefingService.generateDailyBriefing(userId);

            log.info("Daily briefing generated: {} tokens, ${} cost",
                     result.getTokensUsed(),
                     String.format("%.4f", result.getCostUSD()));

            return ResponseEntity.ok(result);

        } catch (Exception e) {
            log.error("Daily briefing generation failed: {}", e.getMessage());
            throw new RuntimeException("Daily briefing generation failed: " + e.getMessage(), e);
        }
    }

    @GetMapping("/rate-limit")
    public ResponseEntity<RateLimitStatusDTO> getRateLimitStatus(
            @AuthenticationPrincipal UserDetails userDetails) {
        log.debug("Rate limit status requested by user: {}", getCurrentUserEmail(userDetails));

        Long userId = getCurrentUserId(userDetails);

        int limit = rateLimitService.getMaxRequests();
        int used = rateLimitService.getUsedRequests(userId);
        int remaining = rateLimitService.getRemainingRequests(userId);

        RateLimitStatusDTO status = new RateLimitStatusDTO(limit, remaining, used);

        return ResponseEntity.ok(status);
    }

    @DeleteMapping("/rate-limit/reset")
    public ResponseEntity<RateLimitStatusDTO> resetRateLimit(
            @AuthenticationPrincipal UserDetails userDetails) {
        Long userId = getCurrentUserId(userDetails);

        log.warn("Rate limit reset requested by user: {}", getCurrentUserEmail(userDetails));
        rateLimitService.resetRateLimit(userId);

        int limit = rateLimitService.getMaxRequests();

        RateLimitStatusDTO status = new RateLimitStatusDTO(limit, limit, 0);

        return ResponseEntity.ok(status);
    }
}