package com.panchakarma.management.model;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "medicines")
public class Medicine {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    private String category; // Churna, Capsules, Tablets, Taila, Ghrita, Avaleha, Arishta, Asava, Kalpa, Gulika, Rasayana, Khanda
    private String supplierName;
    private Long supplierId;
    private String batchNumber;

    private Integer currentStock = 0;
    private Integer minimumStockThreshold = 10;
    private Integer maximumStockLevel = 100;
    private String unit = "packs"; // e.g., 100g packs, 60 cap bottles, 100 tab boxes, 200ml bottle

    private Double mrp = 0.0;
    private Double wholesalePrice = 0.0;

    private LocalDate manufacturingDate;
    private LocalDate expiryDate;

    @Column(length = 1000)
    private String description;

    private String status = "HEALTHY"; // HEALTHY, LOW_STOCK, CRITICAL, OUT_OF_STOCK
    private Boolean lowStockAlertSent = false;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
        calculateStatus();
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
        calculateStatus();
    }

    public void calculateStatus() {
        if (currentStock == null || currentStock <= 0) {
            this.status = "OUT_OF_STOCK";
        } else if (minimumStockThreshold != null && currentStock <= Math.max(2, minimumStockThreshold / 4)) {
            this.status = "CRITICAL";
        } else if (minimumStockThreshold != null && currentStock <= minimumStockThreshold) {
            this.status = "LOW_STOCK";
        } else {
            this.status = "HEALTHY";
        }
    }

    public Medicine() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }

    public String getSupplierName() { return supplierName; }
    public void setSupplierName(String supplierName) { this.supplierName = supplierName; }

    public Long getSupplierId() { return supplierId; }
    public void setSupplierId(Long supplierId) { this.supplierId = supplierId; }

    public String getBatchNumber() { return batchNumber; }
    public void setBatchNumber(String batchNumber) { this.batchNumber = batchNumber; }

    public Integer getCurrentStock() { return currentStock; }
    public void setCurrentStock(Integer currentStock) {
        this.currentStock = currentStock;
        calculateStatus();
    }

    public Integer getMinimumStockThreshold() { return minimumStockThreshold; }
    public void setMinimumStockThreshold(Integer minimumStockThreshold) {
        this.minimumStockThreshold = minimumStockThreshold;
        calculateStatus();
    }

    public Integer getMaximumStockLevel() { return maximumStockLevel; }
    public void setMaximumStockLevel(Integer maximumStockLevel) { this.maximumStockLevel = maximumStockLevel; }

    public String getUnit() { return unit; }
    public void setUnit(String unit) { this.unit = unit; }

    public Double getMrp() { return mrp; }
    public void setMrp(Double mrp) { this.mrp = mrp; }

    public Double getWholesalePrice() { return wholesalePrice; }
    public void setWholesalePrice(Double wholesalePrice) { this.wholesalePrice = wholesalePrice; }

    public LocalDate getManufacturingDate() { return manufacturingDate; }
    public void setManufacturingDate(LocalDate manufacturingDate) { this.manufacturingDate = manufacturingDate; }

    public LocalDate getExpiryDate() { return expiryDate; }
    public void setExpiryDate(LocalDate expiryDate) { this.expiryDate = expiryDate; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getStatus() {
        calculateStatus();
        return status;
    }
    public void setStatus(String status) { this.status = status; }

    public Boolean getLowStockAlertSent() { return lowStockAlertSent; }
    public void setLowStockAlertSent(Boolean lowStockAlertSent) { this.lowStockAlertSent = lowStockAlertSent; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
