package com.lockin.lockin_app.controller;

import com.lockin.lockin_app.dto.BriefingResultDTO;
import com.lockin.lockin_app.dto.EnhancementResultDTO;
import com.lockin.lockin_app.dto.TaskBreakdownRequestDTO;
import com.lockin.lockin_app.dto.TaskBreakdownResultDTO;
import com.lockin.lockin_app.entity.Task;
import com.lockin.lockin_app.entity.User;
import com.lockin.lockin_app.service.*;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;


@Slf4j
@RestController
@RequestMapping("/api/ai")
@RequiredArgsConstructor
public class AIController {

    private final TaskBreakdownService taskBreakdownService;
    private final TaskService taskService;
    private final UserService userService;
    private final DescriptionEnhancementService descriptionEnhancementService;
    private final DailyBriefingService dailyBriefingService;


    @PostMapping("/breakdown/{taskId}")
    public ResponseEntity<TaskBreakdownResultDTO> breakdownTask(
            @PathVariable Long taskId,
            @AuthenticationPrincipal UserDetails userDetails) {

        log.info("AI breakdown requested for task {} by user {}", taskId, userDetails.getUsername());

        Long userId = userService.getUserIdFromEmail(userDetails.getUsername());
        Task task = taskService.getTaskEntity(taskId, userId);

        try {
            TaskBreakdownResultDTO result = taskBreakdownService.breakdownTask(
                    task.getTitle(),
                    task.getDescription(),
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
                 userDetails.getUsername(), request.getTitle());

        Long userId = userService.getUserIdFromEmail(userDetails.getUsername());
        Task tempTask = new Task();
        tempTask.setTitle(request.getTitle());
        tempTask.setDescription(request.getDescription());

        User user = userService.getUserById(userId);
        tempTask.setUser(user);

        try {
            TaskBreakdownResultDTO result = taskBreakdownService.breakdownTask(
                    request.getTitle(),
                    request.getDescription(),
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
                 userDetails.getUsername(), request.getTitle());

        Long userId = userService.getUserIdFromEmail(userDetails.getUsername());

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
        log.info("Daily briefing requested by user: {}", userDetails.getUsername());

        Long userId = userService.getUserIdFromEmail(userDetails.getUsername());

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
}
