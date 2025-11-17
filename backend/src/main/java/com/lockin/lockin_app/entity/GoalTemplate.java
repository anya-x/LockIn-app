package com.lockin.lockin_app.entity;

public enum GoalTemplate {
    PRODUCTIVE_WEEK(
            "Productive Week",
            "Complete 30 tasks and 40 pomodoros in a week",
            30,
            40,
            null,
            7),
    FOCUS_MONTH(
            "Focus Month",
            "Complete 100 pomodoros and 2000 minutes of focus in a month",
            null,
            100,
            2000,
            30),
    BALANCED_DAY(
            "Balanced Day",
            "Complete 5 tasks with 4 hours of focus and low burnout",
            5,
            null,
            240,
            1);

    private final String name;
    private final String description;
    private final Integer tasksTarget;
    private final Integer pomodorosTarget;
    private final Integer focusMinutesTarget;
    private final Integer durationDays;

    GoalTemplate(
            String name,
            String description,
            Integer tasksTarget,
            Integer pomodorosTarget,
            Integer focusMinutesTarget,
            Integer durationDays) {
        this.name = name;
        this.description = description;
        this.tasksTarget = tasksTarget;
        this.pomodorosTarget = pomodorosTarget;
        this.focusMinutesTarget = focusMinutesTarget;
        this.durationDays = durationDays;
    }

    public String getName() {
        return name;
    }

    public String getDescription() {
        return description;
    }

    public Integer getTasksTarget() {
        return tasksTarget;
    }

    public Integer getPomodorosTarget() {
        return pomodorosTarget;
    }

    public Integer getFocusMinutesTarget() {
        return focusMinutesTarget;
    }

    public Integer getDurationDays() {
        return durationDays;
    }
}
