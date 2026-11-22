package com.practice.taskboard.task;


import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.util.List;

@RestController
@RequestMapping("/api/tasks")
public class TaskController {

    private final TaskService taskService;

    public TaskController(TaskService taskService) {
        this.taskService = taskService;
    }

    @GetMapping
    public List<Task> list() {
        return taskService.findAll();
    }

    @GetMapping("/{id}")
    public Task get(@PathVariable long id) {
        return taskService.findById(id);
    }

    @PostMapping
    public ResponseEntity<Task> create(@RequestBody CreateTaskRequest request) {
        Task task = taskService.create(request.title());
        URI location = URI.create("/api/tasks/" + task.id());
        return ResponseEntity.created(location).body(task);
    }

    @PatchMapping("/{id}")
    public Task changeStatus(@PathVariable long id, @RequestBody UpdateStatusRequest request) {
        return taskService.changeStatus(id, request.status());
    }
}
