package com.practice.taskboard.task;

import java.time.Instant;

public record Task(long id, String title, TaskStatus status, Instant createdAt) {
}