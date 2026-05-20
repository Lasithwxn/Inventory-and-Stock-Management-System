package com.stockr.stockr.service;

import com.stockr.stockr.model.Report;
import com.stockr.stockr.repository.ReportRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ReportService {



    @Autowired
    private ReportRepository reportRepository;

    public List<Report> getActiveReports() {
        return reportRepository.findByIsActiveTrue();
    }

    public Report getReport(Long id) {
        return reportRepository.findById(id).orElseThrow(() -> new RuntimeException("Report not found"));
    }


    public Report createReport(Report report) {
        return reportRepository.save(report);
    }

    public void deleteReport(Long id) {
        reportRepository.deleteById(id);
    }
}