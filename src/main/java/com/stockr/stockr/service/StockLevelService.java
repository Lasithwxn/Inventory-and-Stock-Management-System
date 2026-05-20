package com.stockr.stockr.service;

import com.stockr.stockr.model.StockLevel;
import com.stockr.stockr.repository.StockLevelRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class StockLevelService {

    @Autowired
    private StockLevelRepository stockLevelRepository;

    public List<StockLevel> getAllStock() {
        return stockLevelRepository.findAll();
    }

    public Optional<StockLevel> adjustStock(Long productId, Integer quantity) {
        return stockLevelRepository.findByProductId(productId).map(existing -> {
            existing.setQuantity(quantity);
            return stockLevelRepository.save(existing);
        });
    }
}