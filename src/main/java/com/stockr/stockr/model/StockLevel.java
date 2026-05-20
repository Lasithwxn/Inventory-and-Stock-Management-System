package com.stockr.stockr.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "stock_levels")
public class StockLevel {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "product_id")
    private Long productId;

    private Integer quantity;

    @Column(name = "last_updated")
    private LocalDateTime lastUpdated;

    @PrePersist
    @PreUpdate
    protected void onUpdate() { lastUpdated = LocalDateTime.now(); }

    public Long getId()                        { return id; }
    public Long getProductId()                 { return productId; }
    public void setProductId(Long productId)   { this.productId = productId; }
    public Integer getQuantity()               { return quantity; }
    public void setQuantity(Integer quantity)  { this.quantity = quantity; }
    public LocalDateTime getLastUpdated()      { return lastUpdated; }
}