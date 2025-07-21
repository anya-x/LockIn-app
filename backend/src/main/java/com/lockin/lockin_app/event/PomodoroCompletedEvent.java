package com.lockin.lockin_app.event;

import lombok.Getter;

import org.springframework.context.ApplicationEvent;

@Getter
public class PomodoroCompletedEvent extends ApplicationEvent {
    private final Long userId;
    private final Long sessionId;

    public PomodoroCompletedEvent(Object source, Long userId, Long sessionId) {
        super(source);
        this.userId = userId;
        this.sessionId = sessionId;
    }
}
