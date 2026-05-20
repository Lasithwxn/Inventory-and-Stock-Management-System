package com.stockr.stockr.controller;

import com.stockr.stockr.dto.DailyOrderCountDTO;
import com.stockr.stockr.model.Report;
import com.stockr.stockr.service.ReportExportService;
import com.stockr.stockr.service.ReportService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.StreamingResponseBody;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/reports")
@CrossOrigin(origins = "http://localhost:8080", allowCredentials = "true")
public class ReportController {

    @Autowired
    private ReportService reportService;

    @Autowired
    private ReportExportService exportService;

    @Autowired
    private com.stockr.stockr.repository.PurchaseOrderRepository purchaseOrderRepository;

    @GetMapping
    public List<Report> getReports() {
        return reportService.getActiveReports();
    }

    @GetMapping("/revenue")
    public List<DailyOrderCountDTO> getRevenue(@RequestParam(defaultValue = "7D") String period) {
        int days = period.equals("30D") ? 30 : period.equals("90D") ? 90 : 7;
        LocalDate today = LocalDate.now();
        LocalDate start = today.minusDays(days - 1);

        List<Object[]> rows = purchaseOrderRepository.countOrdersByDateSince(start);
        Map<String, Integer> countMap = new HashMap<>();
        for (Object[] row : rows) {
            String dateStr = row[0].toString();
            int count = ((Number) row[1]).intValue();
            countMap.put(dateStr, count);
        }

        List<DailyOrderCountDTO> result = new ArrayList<>();
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("MMM d");

        for (int i = days - 1; i >= 0; i--) {
            LocalDate d = today.minusDays(i);
            String dbKey = d.toString();
            String label = d.format(fmt);
            int count = countMap.getOrDefault(dbKey, 0);
            result.add(new DailyOrderCountDTO(label, count));
        }

        return result;
    }

    @GetMapping("/{id}/download")
    public ResponseEntity<StreamingResponseBody> download(@PathVariable Long id) {
        Report report = reportService.getActiveReports().stream()
                .filter(r -> r.getId().equals(id)).findFirst()
                .orElseThrow(() -> new RuntimeException("Report not found"));

        String filename = report.getReportName().replaceAll("\\s+", "_") + ".csv";

        StreamingResponseBody stream = out -> {
            java.io.Writer writer = new java.io.OutputStreamWriter(out, java.nio.charset.StandardCharsets.UTF_8);
            exportService.writeCsv(report.getCategory(), writer);
            writer.flush();
        };

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .contentType(MediaType.parseMediaType("text/csv; charset=UTF-8"))
                .body(stream);
    }

    @PostMapping
    public ResponseEntity<Map<String, Object>> createReport(@RequestBody Report report) {
        Report saved = reportService.createReport(report);
        Map<String, Object> res = new HashMap<>();
        res.put("success", true);
        res.put("message", "Report created");
        res.put("data", saved);
        return ResponseEntity.ok(res);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, Object>> deleteReport(@PathVariable Long id) {
        reportService.deleteReport(id);
        Map<String, Object> res = new HashMap<>();
        res.put("success", true);
        res.put("message", "Report deleted");
        return ResponseEntity.ok(res);
    }
}