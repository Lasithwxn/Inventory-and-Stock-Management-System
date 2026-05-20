package com.stockr.stockr.service;

import com.stockr.stockr.model.Feedback;
import com.stockr.stockr.repository.FeedbackRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class FeedbackService {

    @Autowired
    private FeedbackRepository feedbackRepository;

    public List<Feedback> getAllFeedback() {
        return feedbackRepository.findAll();
    }

    public Feedback createFeedback(Feedback feedback) {
        if (feedback.getIsBugReport() == null) {
            feedback.setIsBugReport(false);
        }
        if (feedback.getStatus() == null) {
            feedback.setStatus(Feedback.Status.NEW);
        }
        return feedbackRepository.save(feedback);
    }

    public void deleteFeedback(Long id) {
        feedbackRepository.deleteById(id);
    }
}