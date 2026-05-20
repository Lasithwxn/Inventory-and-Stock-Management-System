package com.stockr.stockr.controller;

import com.stockr.stockr.model.Product;
import com.stockr.stockr.model.Category;
import com.stockr.stockr.model.StockLevel;
import com.stockr.stockr.repository.ProductRepository;
import com.stockr.stockr.repository.CategoryRepository;
import com.stockr.stockr.repository.StockLevelRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.*;

@RestController
@RequestMapping("/api/products")
public class ProductController {

    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;
    private final StockLevelRepository stockLevelRepository;

    public ProductController(ProductRepository productRepository,
                             CategoryRepository categoryRepository,
                             StockLevelRepository stockLevelRepository) {
        this.productRepository    = productRepository;
        this.categoryRepository   = categoryRepository;
        this.stockLevelRepository = stockLevelRepository;
    }

    // GET /api/products — returns products with category name and stock quantity
    @GetMapping
    public ResponseEntity<List<ProductDTO>> getAll() {
        List<Product> products = productRepository.findAll();
        List<ProductDTO> dtos = products.stream().map(p -> {
            String catName = categoryRepository.findById(p.getCategoryId() != null ? p.getCategoryId() : 0L)
                    .map(Category::getName).orElse("—");
            int qty = stockLevelRepository.findByProductId(p.getId())
                    .map(StockLevel::getQuantity).orElse(0);
            return ProductDTO.from(p, catName, qty);
        }).toList();
        return ResponseEntity.ok(dtos);
    }

    // POST /api/products
    @PostMapping
    public ResponseEntity<Map<String, Object>> create(@RequestBody Map<String, Object> body) {
        Map<String, Object> res = new HashMap<>();
        String name = (String) body.get("name");
        String sku  = (String) body.get("sku");
        if (name == null || name.isBlank()) {
            res.put("success", false); res.put("message", "Product name is required.");
            return ResponseEntity.badRequest().body(res);
        }
        if (sku != null && productRepository.existsBySku(sku.trim())) {
            res.put("success", false); res.put("message", "SKU already exists.");
            return ResponseEntity.ok(res);
        }
        Product p = new Product();
        p.setName(name.trim());
        p.setSku(sku != null ? sku.trim() : null);
        p.setDescription((String) body.getOrDefault("description", ""));
        p.setUnit((String) body.getOrDefault("unit", "pcs"));
        p.setActive(true);
        if (body.get("categoryId") != null)  p.setCategoryId(Long.parseLong(body.get("categoryId").toString()));
        if (body.get("supplierId") != null)  p.setSupplierId(Long.parseLong(body.get("supplierId").toString()));
        if (body.get("unitPrice")  != null)  p.setUnitPrice(new BigDecimal(body.get("unitPrice").toString()));
        productRepository.save(p);

        // Create initial stock level of 0
        StockLevel sl = new StockLevel();
        sl.setProductId(p.getId());
        sl.setQuantity(0);
        stockLevelRepository.save(sl);

        res.put("success", true); res.put("message", "Product created successfully.");
        return ResponseEntity.ok(res);
    }

    // PUT /api/products/{id}
    @PutMapping("/{id}")
    public ResponseEntity<Map<String, Object>> update(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        Map<String, Object> res = new HashMap<>();
        var opt = productRepository.findById(id);
        if (opt.isEmpty()) { res.put("success", false); res.put("message", "Product not found."); return ResponseEntity.ok(res); }
        Product p = opt.get();
        if (body.containsKey("name") && !((String)body.get("name")).isBlank()) p.setName(((String)body.get("name")).trim());
        if (body.containsKey("description")) p.setDescription((String)body.get("description"));
        if (body.containsKey("unit"))        p.setUnit((String)body.get("unit"));
        if (body.containsKey("categoryId") && body.get("categoryId") != null) p.setCategoryId(Long.parseLong(body.get("categoryId").toString()));
        if (body.containsKey("unitPrice")  && body.get("unitPrice")  != null) p.setUnitPrice(new BigDecimal(body.get("unitPrice").toString()));
        productRepository.save(p);
        res.put("success", true); res.put("message", "Product updated successfully.");
        return ResponseEntity.ok(res);
    }

    // PUT /api/products/{id}/toggle — toggle active status
    @PutMapping("/{id}/toggle")
    public ResponseEntity<Map<String, Object>> toggle(@PathVariable Long id) {
        Map<String, Object> res = new HashMap<>();
        var opt = productRepository.findById(id);
        if (opt.isEmpty()) { res.put("success", false); res.put("message", "Product not found."); return ResponseEntity.ok(res); }
        Product p = opt.get();
        p.setActive(!Boolean.TRUE.equals(p.getActive()));
        productRepository.save(p);
        res.put("success", true); res.put("active", p.getActive());
        res.put("message", "Product " + (p.getActive() ? "activated" : "deactivated") + ".");
        return ResponseEntity.ok(res);
    }

    // DELETE /api/products/{id}
    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, Object>> delete(@PathVariable Long id) {
        Map<String, Object> res = new HashMap<>();
        if (!productRepository.existsById(id)) { res.put("success", false); res.put("message", "Product not found."); return ResponseEntity.ok(res); }
        productRepository.deleteById(id);
        res.put("success", true); res.put("message", "Product deleted successfully.");
        return ResponseEntity.ok(res);
    }

    public static class ProductDTO {
        public Long id; public String name; public String sku; public String description;
        public String categoryName; public Long categoryId; public Long supplierId;
        public BigDecimal unitPrice; public String unit; public Boolean active; public Integer stockQty;
        public String stockStatus; // ACTIVE, LOW_STOCK, OUT_OF_STOCK

        public static ProductDTO from(Product p, String catName, int qty) {
            ProductDTO d = new ProductDTO();
            d.id = p.getId(); d.name = p.getName(); d.sku = p.getSku();
            d.description = p.getDescription(); d.categoryName = catName;
            d.categoryId = p.getCategoryId(); d.supplierId = p.getSupplierId();
            d.unitPrice = p.getUnitPrice(); d.unit = p.getUnit();
            d.active = Boolean.TRUE.equals(p.getActive()); d.stockQty = qty;
            d.stockStatus = qty == 0 ? "OUT_OF_STOCK" : qty <= 10 ? "LOW_STOCK" : "IN_STOCK";
            return d;
        }
    }
}