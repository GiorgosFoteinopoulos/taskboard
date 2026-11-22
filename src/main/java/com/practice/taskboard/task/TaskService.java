package com.practice.taskboard.task;


import java.time.Instant;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class TaskService {

    private static final int MAX_TITLE_LENGTH = 100;

    private final Map<Long, Task> tasks = new ConcurrentHashMap<Long, Task>();
    private final AtomicLong nextId = new AtomicLong(1);

    public TaskService() {
        add("Read the Jira tutorial", TaskStatus.DONE);
        add("Write the task API", TaskStatus.IN_PROGRESS);
        add("Connect the page with fetch", TaskStatus.TODO);
    }

    public List<Task> findAll() {
        return tasks.values().stream()
                .sorted(Comparator.comparing(Task::id))
                .toList();
    }

    public Task findById(long id) {
        Task task = tasks.get(id);
        if (task == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Task " + id + " not found");
        }
        return task;
    }

    public  Task create(String rawTitle) {
        return add(validTitle(rawTitle), TaskStatus.TODO);
    }

    public Task changeStatus(long id, TaskStatus newStatus) {
        if (newStatus == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Status is required");
        }
        Task updated = findById(id).withStatus(newStatus);
        tasks.put(id, updated);
        return updated;
    }

    private Task add(String title, TaskStatus status) {
        long id = nextId.getAndIncrement();
        Task task = new Task(id, title, status, Instant.now());
        tasks.put(id, task);
        return task;
    }

    private static String validTitle(String rawTitle) {
        String title = rawTitle == null ? "" : rawTitle.strip();
        if (title.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Title must not be empty");
        }
        if (title.length() > MAX_TITLE_LENGTH) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Title must be at most " +  MAX_TITLE_LENGTH + " characters");
        }
        return title;
    }

    public void delete(long id) {
        if (tasks.remove(id) == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Task " + id + " not found");
        }
    }
}
