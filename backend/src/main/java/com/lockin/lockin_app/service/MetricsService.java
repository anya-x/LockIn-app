package com.lockin.lockin_app.service;

import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.Timer;
import org.springframework.stereotype.Service;

import java.time.Duration;

/**
 * Service for tracking custom business metrics.
 * These metrics are exposed via /actuator/prometheus and scraped by Prometheus.
 *
 * Key metrics tracked:
 * - Task lifecycle events (created, completed, deleted)
 * - Focus session lifecycle (started, completed, abandoned)
 * - Focus session duration distribution
 * - Goal creation and achievement
 * - Category usage
 */
@Service
public class MetricsService {

    // Task metrics
    private final Counter tasksCreated;
    private final Counter tasksCompleted;
    private final Counter tasksDeleted;

    // Focus session metrics
    private final Counter focusSessionsStarted;
    private final Counter focusSessionsCompleted;
    private final Counter focusSessionsAbandoned;
    private final Timer focusSessionDuration;

    // Goal metrics
    private final Counter goalsCreated;
    private final Counter goalsAchieved;

    // Category metrics
    private final Counter categoriesCreated;

    /**
     * Constructor injection of MeterRegistry.
     * Spring Boot auto-configures this based on the micrometer-registry-prometheus dependency.
     *
     * @param registry The meter registry to register metrics with
     */
    public MetricsService(MeterRegistry registry) {
        // Task metrics - use Counter for monotonically increasing values
        this.tasksCreated = Counter.builder("lockin.tasks.created")
            .description("Total number of tasks created")
            .tag("type", "task")
            .register(registry);

        this.tasksCompleted = Counter.builder("lockin.tasks.completed")
            .description("Total number of tasks completed")
            .tag("type", "task")
            .register(registry);

        this.tasksDeleted = Counter.builder("lockin.tasks.deleted")
            .description("Total number of tasks deleted")
            .tag("type", "task")
            .register(registry);

        // Focus session metrics
        this.focusSessionsStarted = Counter.builder("lockin.focus_sessions.started")
            .description("Total focus sessions started")
            .tag("type", "focus_session")
            .register(registry);

        this.focusSessionsCompleted = Counter.builder("lockin.focus_sessions.completed")
            .description("Total focus sessions completed successfully")
            .tag("type", "focus_session")
            .register(registry);

        this.focusSessionsAbandoned = Counter.builder("lockin.focus_sessions.abandoned")
            .description("Total focus sessions abandoned before completion")
            .tag("type", "focus_session")
            .register(registry);

        // Timer tracks both count and distribution of durations
        this.focusSessionDuration = Timer.builder("lockin.focus_session.duration")
            .description("Duration of completed focus sessions")
            .tag("type", "focus_session")
            .register(registry);

        // Goal metrics
        this.goalsCreated = Counter.builder("lockin.goals.created")
            .description("Total number of goals created")
            .tag("type", "goal")
            .register(registry);

        this.goalsAchieved = Counter.builder("lockin.goals.achieved")
            .description("Total number of goals achieved")
            .tag("type", "goal")
            .register(registry);

        // Category metrics
        this.categoriesCreated = Counter.builder("lockin.categories.created")
            .description("Total number of categories created")
            .tag("type", "category")
            .register(registry);
    }

    // Task metric methods
    public void incrementTasksCreated() {
        tasksCreated.increment();
    }

    public void incrementTasksCompleted() {
        tasksCompleted.increment();
    }

    public void incrementTasksDeleted() {
        tasksDeleted.increment();
    }

    // Focus session metric methods
    public void incrementFocusSessionsStarted() {
        focusSessionsStarted.increment();
    }

    /**
     * Record a completed focus session.
     * This increments the completion counter AND records the duration distribution.
     *
     * @param duration How long the session lasted
     */
    public void recordFocusSessionCompleted(Duration duration) {
        focusSessionsCompleted.increment();
        focusSessionDuration.record(duration);
    }

    public void incrementFocusSessionsAbandoned() {
        focusSessionsAbandoned.increment();
    }

    // Goal metric methods
    public void incrementGoalsCreated() {
        goalsCreated.increment();
    }

    public void incrementGoalsAchieved() {
        goalsAchieved.increment();
    }

    // Category metric methods
    public void incrementCategoriesCreated() {
        categoriesCreated.increment();
    }
}
