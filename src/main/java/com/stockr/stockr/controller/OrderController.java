package com.stockr.stockr.controller;

import com.stockr.stockr.model.PurchaseOrder;
import com.stockr.stockr.service.PurchaseOrderService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/orders")
@CrossOrigin(origins = "http://localhost:8080", allowCredentials = "true")
public class OrderController {

    @Autowired
    private PurchaseOrderService purchaseOrderService;

    @GetMapping
    public List<PurchaseOrder> getAllOrders() {
        return purchaseOrderService.getAllOrders();
    }

    @GetMapping("/summary")
    public ResponseEntity<Map<String, Object>> getSummary() {
        List<PurchaseOrder> all = purchaseOrderService.getAllOrders();
        Map<String, Object> summary = new HashMap<>();
        summary.put("total", all.size());
        summary.put("pending", all.stream().filter(o -> "PENDING".equals(o.getStatus())).count());
        summary.put("approved", all.stream().filter(o -> "APPROVED".equals(o.getStatus())).count());
        summary.put("received", all.stream().filter(o -> "RECEIVED".equals(o.getStatus())).count());
        return ResponseEntity.ok(summary);
    }

    @PostMapping
    public ResponseEntity<Map<String, Object>> createOrder(@RequestBody PurchaseOrder order) {
        PurchaseOrder saved = purchaseOrderService.createOrder(order);
        return success("Order created successfully", saved);
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<Map<String, Object>> updateStatus(@PathVariable Long id, @RequestBody Map<String, String> body) {
        String newStatus = body.get("status");
        Optional<PurchaseOrder> result = purchaseOrderService.updateOrderStatus(id, newStatus);
        if (result.isPresent()) {
            return success("Status updated to " + newStatus, result.get());
        }
        return error("Order not found");
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, Object>> deleteOrder(@PathVariable Long id) {
        purchaseOrderService.deleteOrder(id);
        return success("Order deleted successfully", null);
    }

    private ResponseEntity<Map<String, Object>> success(String msg, Object data) {
        Map<String, Object> map = new HashMap<>();
        map.put("success", true);
        map.put("message", msg);
        map.put("data", data); 
        return ResponseEntity.ok(map);
    }

    private ResponseEntity<Map<String, Object>> error(String msg) {
        Map<String, Object> map = new HashMap<>();
        map.put("success", false);
        map.put("message", msg);
        return ResponseEntity.badRequest().body(map);
    }
}