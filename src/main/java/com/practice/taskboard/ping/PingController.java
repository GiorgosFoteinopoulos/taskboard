package com.practice.taskboard.ping;

import java.time.Instant;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class PingController {

    @GetMapping("/api/ping")
    public Ping ping() {
        return new Ping("pong", Instant.now().toString());
    }

    public record Ping(String message, String serverTime) {
    }
}