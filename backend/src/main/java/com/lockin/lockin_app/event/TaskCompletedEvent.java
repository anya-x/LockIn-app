package com.lockin.lockin_app.event;

import lombok.Getter;
import org.springframework.context.ApplicationEvent;

@Getter
public class TaskCompletedEvent extends ApplicationEvent {
    private final Long userId;
    private final Long taskId;

    public TaskCompletedEvent(Object source, Long userId, Long taskId) {
        super(source);
        this.userId = userId;
        this.taskId = taskId;
    }
}
