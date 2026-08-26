package com.panchakarma.management.repository;

import com.panchakarma.management.model.Medicine;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface MedicineRepository extends JpaRepository<Medicine, Long> {
    List<Medicine> findByCategory(String category);
    List<Medicine> findByStatus(String status);
    List<Medicine> findByExpiryDateBefore(LocalDate date);
    
    @Query("SELECT m FROM Medicine m WHERE m.currentStock <= m.minimumStockThreshold")
    List<Medicine> findLowStockMedicines();

    List<Medicine> findByNameContainingIgnoreCaseOrBatchNumberContainingIgnoreCaseOrSupplierNameContainingIgnoreCase(
            String name, String batchNumber, String supplierName
    );
}
