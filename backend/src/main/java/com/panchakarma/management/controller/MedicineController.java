package com.panchakarma.management.controller;

import com.panchakarma.management.model.Medicine;
import com.panchakarma.management.service.MedicineService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/medicines")
public class MedicineController {

    private final MedicineService medicineService;

    public MedicineController(MedicineService medicineService) {
        this.medicineService = medicineService;
    }

    @GetMapping
    public ResponseEntity<List<Medicine>> getAllMedicines(@RequestParam(required = false) String search) {
        if (search != null && !search.isBlank()) {
            return ResponseEntity.ok(medicineService.searchMedicines(search));
        }
        return ResponseEntity.ok(medicineService.getAllMedicines());
    }

    @GetMapping("/details")
    public ResponseEntity<Map<String, Object>> getMedicineDetails(@RequestParam String name) {
        return ResponseEntity.ok(medicineService.getMedicineDetails(name));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Medicine> getMedicineById(@PathVariable Long id) {
        return ResponseEntity.ok(medicineService.getMedicineById(id));
    }

    @PostMapping
    public ResponseEntity<Medicine> createMedicine(@RequestBody Medicine medicine) {
        return ResponseEntity.ok(medicineService.createMedicine(medicine));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Medicine> updateMedicine(@PathVariable Long id, @RequestBody Medicine medicine) {
        return ResponseEntity.ok(medicineService.updateMedicine(id, medicine));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, String>> deleteMedicine(@PathVariable Long id) {
        medicineService.deleteMedicine(id);
        return ResponseEntity.ok(Map.of("message", "Medicine deleted successfully"));
    }

    @PostMapping("/{id}/adjust-stock")
    public ResponseEntity<Medicine> adjustStock(
            @PathVariable Long id,
            @RequestBody Map<String, Object> body) {
        int quantity = body.get("quantity") != null ? Integer.parseInt(body.get("quantity").toString()) : 0;
        String type = body.get("type") != null ? body.get("type").toString() : "ADJUSTMENT";
        String notes = body.get("notes") != null ? body.get("notes").toString() : "";
        String referenceNo = body.get("referenceNo") != null ? body.get("referenceNo").toString() : null;
        String operatorName = body.get("operatorName") != null ? body.get("operatorName").toString() : "Pharmacist";

        return ResponseEntity.ok(medicineService.adjustStock(id, quantity, type, notes, referenceNo, operatorName));
    }

    @GetMapping("/low-stock")
    public ResponseEntity<List<Medicine>> getLowStockMedicines() {
        return ResponseEntity.ok(medicineService.getLowStockMedicines());
    }

    @GetMapping("/expiring")
    public ResponseEntity<List<Medicine>> getExpiringMedicines(@RequestParam(defaultValue = "30") int days) {
        return ResponseEntity.ok(medicineService.getExpiringMedicines(days));
    }
}
