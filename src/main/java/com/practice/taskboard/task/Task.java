package com.practice.taskboard.task;

import java.time.Instant;

public record Task(long id, String title, TaskStatus status, Instant createdAt) {

    public Task withStatus(TaskStatus newStatus) {
        return new Task(id, title, newStatus, createdAt);
    }
}