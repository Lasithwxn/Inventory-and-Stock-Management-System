package com.stockr.stockr.model;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "products")
public class Product {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;
    private String sku;
    private String description;

    @Column(name = "category_id")
    private Long categoryId;

    @Column(name = "supplier_id")
    private Long supplierId;

    @Column(name = "unit_price")
    private BigDecimal unitPrice;

    private String unit;

    @Column(name = "active")
    private Boolean active = true;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() { createdAt = LocalDateTime.now(); updatedAt = LocalDateTime.now(); }

    @PreUpdate
    protected void onUpdate() { updatedAt = LocalDateTime.now(); }

    public Long getId()                          { return id; }
    public String getName()                      { return name; }
    public void setName(String name)             { this.name = name; }
    public String getSku()                       { return sku; }
    public void setSku(String sku)               { this.sku = sku; }
    public String getDescription()               { return description; }
    public void setDescription(String v)         { this.description = v; }
    public Long getCategoryId()                  { return categoryId; }
    public void setCategoryId(Long v)            { this.categoryId = v; }
    public Long getSupplierId()                  { return supplierId; }
    public void setSupplierId(Long v)            { this.supplierId = v; }
    public BigDecimal getUnitPrice()             { return unitPrice; }
    public void setUnitPrice(BigDecimal v)       { this.unitPrice = v; }
    public String getUnit()                      { return unit; }
    public void setUnit(String unit)             { this.unit = unit; }
    public Boolean getActive()                   { return active; }
    public void setActive(Boolean active)        { this.active = active; }
    public LocalDateTime getCreatedAt()          { return createdAt; }
    public LocalDateTime getUpdatedAt()          { return updatedAt; }
}