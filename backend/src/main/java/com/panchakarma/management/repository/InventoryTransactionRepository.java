package com.panchakarma.management.repository;

import com.panchakarma.management.model.InventoryTransaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface InventoryTransactionRepository extends JpaRepository<InventoryTransaction, Long> {
    List<InventoryTransaction> findByTypeOrderByDateDesc(String type);
    List<InventoryTransaction> findAllByOrderByDateDesc();
}
