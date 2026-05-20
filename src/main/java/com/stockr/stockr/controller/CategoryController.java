package com.stockr.stockr.controller;

import com.stockr.stockr.model.Category;
import com.stockr.stockr.repository.CategoryRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/categories")
public class CategoryController {

    private final CategoryRepository categoryRepository;

    public CategoryController(CategoryRepository categoryRepository) {
        this.categoryRepository = categoryRepository;
    }

    // GET /api/categories
    @GetMapping
    public ResponseEntity<List<CategoryDTO>> getAll() {
        return ResponseEntity.ok(
                categoryRepository.findAll().stream().map(CategoryDTO::from).toList()
        );
    }

    // POST /api/categories
    @PostMapping
    public ResponseEntity<Map<String, Object>> create(@RequestBody Map<String, Object> body) {
        Map<String, Object> res = new HashMap<>();
        String name = (String) body.get("name");
        if (name == null || name.isBlank()) {
            res.put("success", false); res.put("message", "Category name is required.");
            return ResponseEntity.badRequest().body(res);
        }
        Category c = new Category();
        c.setName(name.trim());
        c.setDescription((String) body.getOrDefault("description", ""));
        Object thr = body.get("lowStockThreshold");
        if (thr != null) c.setLowStockThreshold(Integer.parseInt(thr.toString()));
        categoryRepository.save(c);
        res.put("success", true); res.put("message", "Category created successfully.");
        return ResponseEntity.ok(res);
    }

    // PUT /api/categories/{id}
    @PutMapping("/{id}")
    public ResponseEntity<Map<String, Object>> update(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        Map<String, Object> res = new HashMap<>();
        var opt = categoryRepository.findById(id);
        if (opt.isEmpty()) { res.put("success", false); res.put("message", "Category not found."); return ResponseEntity.ok(res); }
        Category c = opt.get();
        if (body.containsKey("name") && !((String)body.get("name")).isBlank()) c.setName(((String)body.get("name")).trim());
        if (body.containsKey("description")) c.setDescription((String)body.get("description"));
        if (body.containsKey("lowStockThreshold")) c.setLowStockThreshold(Integer.parseInt(body.get("lowStockThreshold").toString()));
        categoryRepository.save(c);
        res.put("success", true); res.put("message", "Category updated successfully.");
        return ResponseEntity.ok(res);
    }

    // DELETE /api/categories/{id}
    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, Object>> delete(@PathVariable Long id) {
        Map<String, Object> res = new HashMap<>();
        if (!categoryRepository.existsById(id)) { res.put("success", false); res.put("message", "Category not found."); return ResponseEntity.ok(res); }
        categoryRepository.deleteById(id);
        res.put("success", true); res.put("message", "Category deleted successfully.");
        return ResponseEntity.ok(res);
    }

    public static class CategoryDTO {
        public Long id; public String name; public String description; public Integer lowStockThreshold;
        public static CategoryDTO from(Category c) {
            CategoryDTO d = new CategoryDTO();
            d.id = c.getId(); d.name = c.getName(); d.description = c.getDescription(); d.lowStockThreshold = c.getLowStockThreshold();
            return d;
        }
    }
}