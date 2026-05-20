package com.stockr.stockr.controller;

import com.stockr.stockr.model.Supplier;
import com.stockr.stockr.service.SupplierService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/suppliers")
@CrossOrigin(origins = "http://localhost:8080", allowCredentials = "true")
public class SupplierController {
    @Autowired
    private SupplierService supplierService;

    // GET /api/suppliers
    @GetMapping
    public List<Supplier> getAllSuppliers() {
        return supplierService.getAllSuppliers();
    }

    // POST /api/suppliers
    @PostMapping
    public ResponseEntity<Map<String, Object>> createSupplier(@RequestBody Supplier supplier) {
        Supplier saved = supplierService.createSupplier(supplier);
        return success("Supplier created successfully", saved);
    }

    // PUT /api/suppliers/{id}
    @PutMapping("/{id}")
    public ResponseEntity<Map<String, Object>> updateSupplier(@PathVariable Long id, @RequestBody Supplier supplier) {
        Optional<Supplier> result = supplierService.updateSupplier(id, supplier);
        if (result.isPresent()) {
            return success("Supplier updated successfully", result.get());
        }
        return error("Supplier not found");
    }

    // PUT /api/suppliers/{id}/status/toggle
    @PutMapping("/{id}/status/toggle")
    public ResponseEntity<Map<String, Object>> toggleStatus(@PathVariable Long id) {
        Optional<Supplier> result = supplierService.toggleStatus(id);
        if (result.isPresent()) {
            Supplier s = result.get();
            return success("Status toggled to " + (Boolean.TRUE.equals(s.getActive()) ? "ACTIVE" : "INACTIVE"), s);
        }
        return error("Supplier not found");
    }

    // DELETE /api/suppliers/{id}
    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, Object>> deleteSupplier(@PathVariable Long id) {
        supplierService.deleteSupplier(id);
        return success("Supplier deleted successfully", null);
    }

    // --- Response helpers (concrete type, no wildcards) ---

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