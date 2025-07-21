package com.lockin.lockin_app.event;

import lombok.Getter;

import org.springframework.context.ApplicationEvent;

@Getter
public class GoalCompletedEvent extends ApplicationEvent {
    private final Long userId;
    private final Long goalId;

    public GoalCompletedEvent(Object source, Long userId, Long goalId) {
        super(source);
        this.userId = userId;
        this.goalId = goalId;
    }
}
