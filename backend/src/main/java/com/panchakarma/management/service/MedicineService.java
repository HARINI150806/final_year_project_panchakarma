package com.panchakarma.management.service;

import com.panchakarma.management.model.Medicine;
import java.util.List;

public interface MedicineService {
    List<Medicine> getAllMedicines();
    Medicine getMedicineById(Long id);
    Medicine createMedicine(Medicine medicine);
    Medicine updateMedicine(Long id, Medicine medicine);
    void deleteMedicine(Long id);
    Medicine adjustStock(Long medicineId, int quantity, String type, String notes, String referenceNo, String operatorName);
    List<Medicine> getLowStockMedicines();
    List<Medicine> getExpiringMedicines(int days);
    List<Medicine> searchMedicines(String query);
    java.util.Map<String, Object> getMedicineDetails(String name);
}
