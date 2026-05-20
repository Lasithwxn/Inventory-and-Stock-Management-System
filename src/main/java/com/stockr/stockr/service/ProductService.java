package com.stockr.stockr.service;

import com.stockr.stockr.model.Product;
import com.stockr.stockr.repository.ProductRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class ProductService {

    @Autowired
    private ProductRepository productRepository;

    public List<Product> getAllProducts() {
        return productRepository.findAll();
    }

    public Product createProduct(Product product) {
        product.setActive(true);
        return productRepository.save(product);
    }

    public Optional<Product> updateProduct(Long id, Product updated) {
        return productRepository.findById(id).map(existing -> {
            existing.setName(updated.getName());
            existing.setSku(updated.getSku());
            existing.setDescription(updated.getDescription());
            existing.setUnit(updated.getUnit());
            existing.setUnitPrice(updated.getUnitPrice());
            existing.setCategoryId(updated.getCategoryId());
            existing.setSupplierId(updated.getSupplierId());
            return productRepository.save(existing);
        });
    }

    public void deleteProduct(Long id) {
        productRepository.deleteById(id);
    }
}