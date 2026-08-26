package com.panchakarma.management.controller;

import com.panchakarma.management.model.InventoryTransaction;
import com.panchakarma.management.model.PharmacyNotification;
import com.panchakarma.management.model.Prescription;
import com.panchakarma.management.service.PharmacyService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/pharmacist")
public class PharmacistController {

    private final PharmacyService pharmacyService;

    public PharmacistController(PharmacyService pharmacyService) {
        this.pharmacyService = pharmacyService;
    }

    @GetMapping("/dashboard-stats")
    public ResponseEntity<Map<String, Object>> getDashboardStats() {
        return ResponseEntity.ok(pharmacyService.getDashboardStats());
    }

    @GetMapping("/pending-prescriptions")
    public ResponseEntity<List<Prescription>> getPendingPrescriptions() {
        return ResponseEntity.ok(pharmacyService.getPendingPrescriptions());
    }

    @GetMapping("/dispensed-prescriptions")
    public ResponseEntity<List<Prescription>> getDispensedPrescriptions() {
        return ResponseEntity.ok(pharmacyService.getDispensedPrescriptions());
    }

    @PostMapping("/dispense/{prescriptionId}")
    public ResponseEntity<Prescription> dispensePrescription(
            @PathVariable Long prescriptionId,
            @RequestBody(required = false) Map<String, Object> body) {
        String pharmacistName = body != null && body.get("pharmacistName") != null ? body.get("pharmacistName").toString() : "Duty Pharmacist";
        String notes = body != null && body.get("notes") != null ? body.get("notes").toString() : "";

        List<String> selectedMedicineNames = null;
        if (body != null && body.get("selectedMedicineNames") instanceof List) {
            @SuppressWarnings("unchecked")
            List<String> list = (List<String>) body.get("selectedMedicineNames");
            selectedMedicineNames = list;
        }

        return ResponseEntity.ok(pharmacyService.dispensePrescription(prescriptionId, pharmacistName, notes, selectedMedicineNames));
    }

    @GetMapping("/transactions")
    public ResponseEntity<List<InventoryTransaction>> getTransactions(@RequestParam(required = false) String type) {
        return ResponseEntity.ok(pharmacyService.getTransactions(type));
    }

    @GetMapping("/notifications")
    public ResponseEntity<List<PharmacyNotification>> getNotifications() {
        return ResponseEntity.ok(pharmacyService.getNotifications());
    }

    @PatchMapping("/notifications/{id}/read")
    public ResponseEntity<Map<String, String>> markNotificationAsRead(@PathVariable Long id) {
        pharmacyService.markNotificationAsRead(id);
        return ResponseEntity.ok(Map.of("message", "Notification marked as read"));
    }

    @PatchMapping("/notifications/read-all")
    public ResponseEntity<Map<String, String>> markAllNotificationsAsRead() {
        pharmacyService.markAllNotificationsAsRead();
        return ResponseEntity.ok(Map.of("message", "All notifications marked as read"));
    }

    @GetMapping("/reports")
    public ResponseEntity<Map<String, Object>> getReports(@RequestParam(defaultValue = "MONTHLY") String period) {
        return ResponseEntity.ok(pharmacyService.getReportsAnalytics(period));
    }
}
