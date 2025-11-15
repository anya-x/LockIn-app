package com.lockin.lockin_app.config;

import io.micrometer.core.aop.TimedAspect;
import io.micrometer.core.instrument.MeterRegistry;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Configuration for Micrometer metrics and @Timed aspect support.
 *
 * This enables the use of @Timed annotation on methods to automatically
 * track execution time metrics.
 *
 * Example usage:
 * <pre>
 * {@code
 * @Timed(value = "lockin.database.query", description = "Time spent in database queries")
 * public List<Task> getTasksForUser(Long userId) {
 *     return taskRepository.findByUserId(userId);
 * }
 * }
 * </pre>
 */
@Configuration
public class MetricsConfig {

    /**
     * Enables @Timed annotation support for automatic method timing.
     *
     * The TimedAspect is an AOP (Aspect-Oriented Programming) component that
     * intercepts methods annotated with @Timed and records their execution time.
     *
     * @param registry The MeterRegistry to record metrics to
     * @return Configured TimedAspect bean
     */
    @Bean
    public TimedAspect timedAspect(MeterRegistry registry) {
        return new TimedAspect(registry);
    }
}
