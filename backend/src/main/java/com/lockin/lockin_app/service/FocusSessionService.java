package com.lockin.lockin_app.service;

import com.lockin.lockin_app.dto.FocusSessionRequestDTO;
import com.lockin.lockin_app.dto.FocusSessionResponseDTO;
import com.lockin.lockin_app.entity.FocusSession;
import com.lockin.lockin_app.entity.SessionType;
import com.lockin.lockin_app.entity.Task;
import com.lockin.lockin_app.entity.User;
import com.lockin.lockin_app.exception.ResourceNotFoundException;
import com.lockin.lockin_app.exception.UnauthorizedException;
import com.lockin.lockin_app.repository.FocusSessionRepository;
import com.lockin.lockin_app.repository.TaskRepository;
import com.lockin.lockin_app.repository.UserRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class FocusSessionService {

    private final FocusSessionRepository sessionRepository;
    private final UserRepository userRepository;
    private final TaskRepository taskRepository;
    private final GoalService goalService;
    private final MetricsService metricsService;

    @Transactional(readOnly = true)
    public List<FocusSessionResponseDTO> getUserSessions(Long userId) {
        log.debug("Fetching sessions for user: {}", userId);

        List<FocusSession> sessions = sessionRepository.findByUserIdOrderByStartedAtDesc(userId);

        return sessions.stream()
                .map(FocusSessionResponseDTO::fromEntity)
                .collect(Collectors.toList());
    }

    /**
     * Starts a new focus session
     *
     * @param userId user starting the session
     * @param request session configuration (duration, profile, optional task link)
     * @return created session with start timestamp
     * @throws ResourceNotFoundException if task doesn't exist
     * @throws UnauthorizedException if task belongs to another user
     */
    @Transactional
    public FocusSessionResponseDTO startSession(Long userId, FocusSessionRequestDTO request) {
        log.info("Starting session for user: {}", userId);

        User user =
                userRepository
                        .findById(userId)
                        .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        FocusSession session = new FocusSession();
        session.setUser(user);
        session.setPlannedMinutes(request.getPlannedMinutes());
        session.setActualMinutes(0);
        session.setStartedAt(LocalDateTime.now());
        session.setSessionType(request.getSessionType());
        session.setCompleted(false);
        session.setProfileName(request.getProfileName());
        session.setBreakMinutes(request.getBreakMinutes());

        // link to task if provided
        if (request.getTaskId() != null) {
            Task task =
                    taskRepository
                            .findById(request.getTaskId())
                            .orElseThrow(
                                    () ->
                                            new ResourceNotFoundException(
                                                    "Task", "id", request.getTaskId()));

            if (!task.getUser().getId().equals(userId)) {
                throw new UnauthorizedException(
                        "Cannot link session to task owned by another user");
            }

            session.setTask(task);
        }

        FocusSession saved = sessionRepository.save(session);

        // Record metric: focus session started
        metricsService.incrementFocusSessionsStarted();

        log.info("Started session: {}", saved.getId());

        return FocusSessionResponseDTO.fromEntity(saved);
    }

    /**
     * marks a session as completed
     *
     * <p>Records actual minutes worked and completion timestamp, prevents completing an
     * already-completed session.
     *
     * @param actualMinutes actual time worked
     * @throws ResourceNotFoundException if session already completed or minutes negative
     */
    @Transactional
    public FocusSessionResponseDTO completeSession(
            Long sessionId, Long userId, Integer actualMinutes) {
        log.info("Completing session: {} for user: {}", sessionId, userId);

        FocusSession session =
                sessionRepository
                        .findById(sessionId)
                        .orElseThrow(
                                () ->
                                        new ResourceNotFoundException(
                                                "Focus Session", "id", sessionId));

        validateSessionOwnership(session, userId);

        if (session.getCompleted()) {
            throw new ResourceNotFoundException("Session is already completed");
        }

        if (actualMinutes != null && actualMinutes < 0) {
            throw new ResourceNotFoundException("Actual minutes cannot be negative");
        }

        session.setActualMinutes(actualMinutes);
        session.setCompletedAt(LocalDateTime.now());
        session.setCompleted(true);

        FocusSession updated = sessionRepository.save(session);
        FocusSessionResponseDTO response = FocusSessionResponseDTO.fromEntity(updated);

        // Record metric: focus session completed with duration
        java.time.Duration sessionDuration = java.time.Duration.between(
            session.getStartedAt(),
            session.getCompletedAt()
        );
        metricsService.recordFocusSessionCompleted(sessionDuration);

        goalService.updateGoalsFromSession(userId, response);

        log.info("Completed session: {}", updated.getId());

        return response;
    }

    @Transactional
    public FocusSessionResponseDTO updateSession(
            Long sessionId, Long userId, Integer actualMinutes) {
        log.info("Updating session: {} for user: {}", sessionId, userId);

        FocusSession session =
                sessionRepository
                        .findById(sessionId)
                        .orElseThrow(
                                () ->
                                        new ResourceNotFoundException(
                                                "Focus Session", "id", sessionId));

        validateSessionOwnership(session, userId);

        if (actualMinutes != null && actualMinutes < 0) {
            throw new ResourceNotFoundException("Actual minutes cannot be negative");
        }

        session.setActualMinutes(actualMinutes);

        FocusSession updated = sessionRepository.save(session);
        FocusSessionResponseDTO response = FocusSessionResponseDTO.fromEntity(updated);

        goalService.updateGoalsFromSession(userId, response);

        log.info("Updated session: {} with {} minutes", updated.getId(), actualMinutes);

        return FocusSessionResponseDTO.fromEntity(updated);
    }

    @Transactional(readOnly = true)
    public List<FocusSessionResponseDTO> getTodaysSessions(Long userId) {
        LocalDateTime startOfDay = LocalDateTime.now().toLocalDate().atStartOfDay();
        LocalDateTime endOfDay = startOfDay.plusDays(1);

        List<FocusSession> sessions =
                sessionRepository.findTodaysCompletedSessions(
                        userId, SessionType.WORK, startOfDay, endOfDay);

        return sessions.stream()
                .map(FocusSessionResponseDTO::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public Integer getTotalFocusMinutesToday(Long userId) {
        LocalDateTime startOfDay = LocalDateTime.now().toLocalDate().atStartOfDay();
        LocalDateTime endOfDay = startOfDay.plusDays(1);

        List<FocusSession> todaySessions =
                sessionRepository.findTodaysCompletedSessions(
                        userId, SessionType.WORK, startOfDay, endOfDay);

        return todaySessions.stream().mapToInt(FocusSession::getActualMinutes).sum();
    }

    @Transactional
    public FocusSessionResponseDTO updateSessionNotes(Long sessionId, Long userId, String notes) {
        log.info("Updating notes for session: {}", sessionId);

        FocusSession session =
                sessionRepository
                        .findById(sessionId)
                        .orElseThrow(
                                () ->
                                        new ResourceNotFoundException(
                                                "Focus Session", "id", sessionId));

        validateSessionOwnership(session, userId);

        session.setNotes(notes);
        FocusSession updated = sessionRepository.save(session);

        return FocusSessionResponseDTO.fromEntity(updated);
    }

    private void validateSessionOwnership(FocusSession session, Long userId) {
        if (!session.getUser().getId().equals(userId)) {
            log.warn(
                    "User {} attempted to access session {} owned by user {}",
                    userId,
                    session.getId(),
                    session.getUser().getId());
            throw new UnauthorizedException("You do not have permission to access this session");
        }
    }
}
