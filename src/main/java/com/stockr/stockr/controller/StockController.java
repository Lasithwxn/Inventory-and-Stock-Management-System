package com.stockr.stockr.controller;

import com.stockr.stockr.model.Product;
import com.stockr.stockr.model.StockLevel;
import com.stockr.stockr.model.Category;
import com.stockr.stockr.repository.ProductRepository;
import com.stockr.stockr.repository.StockLevelRepository;
import com.stockr.stockr.repository.CategoryRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/stock")
public class StockController {

    private final StockLevelRepository stockLevelRepository;
    private final ProductRepository    productRepository;
    private final CategoryRepository   categoryRepository;

    public StockController(StockLevelRepository stockLevelRepository,
                           ProductRepository productRepository,
                           CategoryRepository categoryRepository) {
        this.stockLevelRepository = stockLevelRepository;
        this.productRepository    = productRepository;
        this.categoryRepository   = categoryRepository;
    }

    // GET /api/stock — all stock levels with product + category info
    @GetMapping
    public ResponseEntity<List<StockDTO>> getAll() {
        List<StockLevel> levels = stockLevelRepository.findAll();
        List<StockDTO> dtos = levels.stream().map(sl -> {
            Product p = productRepository.findById(sl.getProductId()).orElse(null);
            String catName = "—";
            Integer threshold = 10;
            if (p != null && p.getCategoryId() != null) {
                var cat = categoryRepository.findById(p.getCategoryId());
                if (cat.isPresent()) {
                    catName   = cat.get().getName();
                    threshold = cat.get().getLowStockThreshold() != null ? cat.get().getLowStockThreshold() : 10;
                }
            }
            return StockDTO.from(sl, p, catName, threshold);
        }).toList();
        return ResponseEntity.ok(dtos);
    }

    // PUT /api/stock/{productId}/adjust — update quantity
    @PutMapping("/{productId}/adjust")
    public ResponseEntity<Map<String, Object>> adjust(
            @PathVariable Long productId,
            @RequestBody Map<String, Object> body) {

        Map<String, Object> res = new HashMap<>();
        int newQty;
        try { newQty = Integer.parseInt(body.get("quantity").toString()); }
        catch (Exception e) { res.put("success", false); res.put("message", "Invalid quantity."); return ResponseEntity.badRequest().body(res); }

        var opt = stockLevelRepository.findByProductId(productId);
        StockLevel sl;
        if (opt.isPresent()) {
            sl = opt.get();
        } else {
            sl = new StockLevel();
            sl.setProductId(productId);
        }
        sl.setQuantity(newQty);
        stockLevelRepository.save(sl);
        res.put("success", true); res.put("message", "Stock updated to " + newQty + "."); res.put("quantity", newQty);
        return ResponseEntity.ok(res);
    }

    // GET /api/stock/summary — counts for dashboard stat cards
    @GetMapping("/summary")
    public ResponseEntity<Map<String, Object>> summary() {
        List<StockLevel> levels = stockLevelRepository.findAll();
        Map<String, Object> res = new HashMap<>();
        int total    = levels.stream().mapToInt(s -> s.getQuantity() != null ? s.getQuantity() : 0).sum();
        int outOf    = (int) levels.stream().filter(s -> s.getQuantity() != null && s.getQuantity() == 0).count();
        int lowStock = 0;
        for (StockLevel sl : levels) {
            Product p = productRepository.findById(sl.getProductId()).orElse(null);
            if (p == null) continue;
            Integer thr = 10;
            if (p.getCategoryId() != null) {
                var cat = categoryRepository.findById(p.getCategoryId());
                if (cat.isPresent() && cat.get().getLowStockThreshold() != null) thr = cat.get().getLowStockThreshold();
            }
            int qty = sl.getQuantity() != null ? sl.getQuantity() : 0;
            if (qty > 0 && qty <= thr) lowStock++;
        }
        res.put("totalUnits", total);
        res.put("outOfStock", outOf);
        res.put("lowStock",   lowStock);
        res.put("skuCount",   levels.size());
        return ResponseEntity.ok(res);
    }

    public static class StockDTO {
        public Long productId; public String productName; public String sku;
        public String categoryName; public Integer quantity; public Integer lowStockThreshold;
        public String status; // IN_STOCK, LOW_STOCK, OUT_OF_STOCK

        public static StockDTO from(StockLevel sl, Product p, String catName, Integer threshold) {
            StockDTO d = new StockDTO();
            d.productId        = sl.getProductId();
            d.productName      = p != null ? p.getName() : "Unknown";
            d.sku              = p != null ? p.getSku()  : "—";
            d.categoryName     = catName;
            d.quantity         = sl.getQuantity() != null ? sl.getQuantity() : 0;
            d.lowStockThreshold= threshold;
            d.status = d.quantity == 0 ? "OUT_OF_STOCK" : d.quantity <= threshold ? "LOW_STOCK" : "IN_STOCK";
            return d;
        }
    }
}