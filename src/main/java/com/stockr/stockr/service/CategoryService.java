package com.stockr.stockr.service;

import com.stockr.stockr.model.Category;
import com.stockr.stockr.repository.CategoryRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class CategoryService {

    @Autowired
    private CategoryRepository categoryRepository;

    public List<Category> getAllCategories() {
        return categoryRepository.findAll();
    }

    public Category createCategory(Category category) {
        return categoryRepository.save(category);
    }

    public Optional<Category> updateCategory(Long id, Category updated) {
        return categoryRepository.findById(id).map(existing -> {
            existing.setName(updated.getName());
            existing.setDescription(updated.getDescription());
            existing.setLowStockThreshold(updated.getLowStockThreshold());
            return categoryRepository.save(existing);
        });
    }

    public void deleteCategory(Long id) {
        categoryRepository.deleteById(id);
    }
}