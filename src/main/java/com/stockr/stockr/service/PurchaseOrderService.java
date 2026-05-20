package com.stockr.stockr.service;

import com.stockr.stockr.model.PurchaseOrder;
import com.stockr.stockr.repository.PurchaseOrderRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class PurchaseOrderService {

    @Autowired
    private PurchaseOrderRepository purchaseOrderRepository;

    public List<PurchaseOrder> getAllOrders() {
        return purchaseOrderRepository.findAll();
    }

    public PurchaseOrder createOrder(PurchaseOrder order) {
        if (order.getStatus() == null) {
            order.setStatus("PENDING");
        }
        return purchaseOrderRepository.save(order);
    }

    public Optional<PurchaseOrder> updateOrderStatus(Long id, String newStatus) {
        return purchaseOrderRepository.findById(id).map(existing -> {
            existing.setStatus(newStatus);
            return purchaseOrderRepository.save(existing);
        });
    }

    public void deleteOrder(Long id) {
        purchaseOrderRepository.deleteById(id);
    }
}