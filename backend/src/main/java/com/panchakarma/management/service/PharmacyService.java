package com.panchakarma.management.service;

import com.panchakarma.management.model.InventoryTransaction;
import com.panchakarma.management.model.PharmacyNotification;
import com.panchakarma.management.model.Prescription;
import java.util.List;
import java.util.Map;

public interface PharmacyService {
    Map<String, Object> getDashboardStats();
    List<Prescription> getPendingPrescriptions();
    List<Prescription> getDispensedPrescriptions();
    Prescription dispensePrescription(Long prescriptionId, String pharmacistName, String notes);
    Prescription dispensePrescription(Long prescriptionId, String pharmacistName, String notes, List<String> selectedMedicineNames);
    List<InventoryTransaction> getTransactions(String type);
    List<PharmacyNotification> getNotifications();
    void markNotificationAsRead(Long id);
    void markAllNotificationsAsRead();
    Map<String, Object> getReportsAnalytics(String period);
}
