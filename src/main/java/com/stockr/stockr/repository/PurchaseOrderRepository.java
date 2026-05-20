package com.stockr.stockr.repository;

import com.stockr.stockr.model.PurchaseOrder;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface PurchaseOrderRepository extends JpaRepository<PurchaseOrder, Long> {

    @Query("SELECT po.orderDate, COUNT(po.id) FROM PurchaseOrder po WHERE po.orderDate >= ?1 GROUP BY po.orderDate ORDER BY po.orderDate")
    List<Object[]> countOrdersByDateSince(LocalDate startDate);
}