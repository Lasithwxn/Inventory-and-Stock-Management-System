package com.stockr.stockr.service;

import com.stockr.stockr.model.Supplier;
import com.stockr.stockr.repository.SupplierRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class SupplierService {

    @Autowired
    private SupplierRepository supplierRepository;

    public List<Supplier> getAllSuppliers() {
        return supplierRepository.findAll();
    }

    public Supplier createSupplier(Supplier supplier) {
        supplier.setActive(true);
        return supplierRepository.save(supplier);
    }

    public Optional<Supplier> updateSupplier(Long id, Supplier updated) {
        return supplierRepository.findById(id).map(existing -> {
            existing.setName(updated.getName());
            existing.setContactName(updated.getContactName());
            existing.setEmail(updated.getEmail());
            existing.setPhone(updated.getPhone());
            existing.setAddress(updated.getAddress());
            return supplierRepository.save(existing);
        });
    }

    public Optional<Supplier> toggleStatus(Long id) {
        return supplierRepository.findById(id).map(s -> {
            s.setActive(!s.getActive());
            return supplierRepository.save(s);
        });
    }

    public void deleteSupplier(Long id) {
        supplierRepository.deleteById(id);
    }
}