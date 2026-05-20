package com.stockr.stockr.controller;

import com.stockr.stockr.model.Feedback;
import com.stockr.stockr.service.FeedbackService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/feedback")
@CrossOrigin(origins = "http://localhost:8080", allowCredentials = "true")
public class FeedbackController {

    @Autowired
    private FeedbackService feedbackService;

    @GetMapping
    public List<Feedback> getAllFeedback() {
        return feedbackService.getAllFeedback();
    }

    @PostMapping
    public ResponseEntity<Map<String, Object>> createFeedback(@RequestBody Feedback feedback) {
        Feedback saved = feedbackService.createFeedback(feedback);
        return success("Feedback submitted successfully", saved);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, Object>> deleteFeedback(@PathVariable Long id) {
        feedbackService.deleteFeedback(id);
        return success("Feedback deleted successfully", null);
    }

    private ResponseEntity<Map<String, Object>> success(String msg, Object data) {
        Map<String, Object> map = new HashMap<>();
        map.put("success", true);
        map.put("message", msg);
        map.put("data", data);
        return ResponseEntity.ok(map);
    }
}