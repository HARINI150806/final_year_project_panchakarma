package com.panchakarma.management.service.impl;

import com.panchakarma.management.model.InventoryTransaction;
import com.panchakarma.management.model.Medicine;
import com.panchakarma.management.model.PharmacyNotification;
import com.panchakarma.management.model.User;
import com.panchakarma.management.model.UserRole;
import com.panchakarma.management.repository.InventoryTransactionRepository;
import com.panchakarma.management.repository.MedicineRepository;
import com.panchakarma.management.repository.PharmacyNotificationRepository;
import com.panchakarma.management.repository.UserRepository;
import com.panchakarma.management.service.EmailService;
import com.panchakarma.management.service.MedicineService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
public class MedicineServiceImpl implements MedicineService {

    private final MedicineRepository medicineRepository;
    private final InventoryTransactionRepository transactionRepository;
    private final PharmacyNotificationRepository notificationRepository;
    private final UserRepository userRepository;
    private final EmailService emailService;

    public MedicineServiceImpl(MedicineRepository medicineRepository,
                               InventoryTransactionRepository transactionRepository,
                               PharmacyNotificationRepository notificationRepository,
                               UserRepository userRepository,
                               EmailService emailService) {
        this.medicineRepository = medicineRepository;
        this.transactionRepository = transactionRepository;
        this.notificationRepository = notificationRepository;
        this.userRepository = userRepository;
        this.emailService = emailService;
    }

    @Override
    public Medicine getMedicineById(Long id) {
        return medicineRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Medicine not found with ID: " + id));
    }

    @Override
    @Transactional
    public Medicine createMedicine(Medicine medicine) {
        if (medicine.getCurrentStock() == null) medicine.setCurrentStock(0);
        if (medicine.getMinimumStockThreshold() == null) medicine.setMinimumStockThreshold(10);
        medicine.calculateStatus();
        Medicine saved = medicineRepository.save(medicine);

        // Check initial stock status
        evaluateStockAlert(saved);
        return saved;
    }

    @Override
    @Transactional
    public Medicine updateMedicine(Long id, Medicine details) {
        Medicine medicine = getMedicineById(id);
        medicine.setName(details.getName());
        medicine.setCategory(details.getCategory());
        medicine.setSupplierName(details.getSupplierName());
        medicine.setSupplierId(details.getSupplierId());
        medicine.setBatchNumber(details.getBatchNumber());
        if (details.getCurrentStock() != null) medicine.setCurrentStock(Math.max(0, details.getCurrentStock()));
        if (details.getMinimumStockThreshold() != null) medicine.setMinimumStockThreshold(details.getMinimumStockThreshold());
        if (details.getMaximumStockLevel() != null) medicine.setMaximumStockLevel(details.getMaximumStockLevel());
        medicine.setUnit(details.getUnit());
        medicine.setMrp(details.getMrp());
        medicine.setWholesalePrice(details.getWholesalePrice());
        medicine.setManufacturingDate(details.getManufacturingDate());
        medicine.setExpiryDate(details.getExpiryDate());
        medicine.setDescription(details.getDescription());
        medicine.calculateStatus();

        Medicine updated = medicineRepository.save(medicine);
        evaluateStockAlert(updated);
        return updated;
    }

    @Override
    @Transactional
    public void deleteMedicine(Long id) {
        medicineRepository.deleteById(id);
    }

    @Override
    @Transactional
    public Medicine adjustStock(Long medicineId, int quantity, String type, String notes, String referenceNo, String operatorName) {
        Medicine medicine = getMedicineById(medicineId);
        int oldStock = medicine.getCurrentStock() != null ? medicine.getCurrentStock() : 0;
        int newStock;

        if ("STOCK_IN".equalsIgnoreCase(type) || "RETURN".equalsIgnoreCase(type)) {
            newStock = oldStock + Math.abs(quantity);
        } else {
            newStock = Math.max(0, oldStock - Math.abs(quantity));
        }

        medicine.setCurrentStock(newStock);
        medicine.calculateStatus();

        // Create transaction record
        InventoryTransaction tx = new InventoryTransaction();
        tx.setType(type != null ? type.toUpperCase() : "ADJUSTMENT");
        tx.setReferenceNo(referenceNo != null && !referenceNo.isBlank() ? referenceNo : "ADJ-" + System.currentTimeMillis() % 100000);
        tx.setMedicineId(medicine.getId());
        tx.setMedicineName(medicine.getName());
        tx.setQuantity(Math.abs(quantity));
        tx.setTotalValue((medicine.getMrp() != null ? medicine.getMrp() : 0.0) * Math.abs(quantity));
        tx.setSupplierName(medicine.getSupplierName());
        tx.setPharmacistName(operatorName != null ? operatorName : "System Pharmacist");
        tx.setNotes(notes);
        transactionRepository.save(tx);

        Medicine saved = medicineRepository.save(medicine);

        // Check if alert needs to be sent or reset
        evaluateStockAlert(saved);

        return saved;
    }

    @Override
    public List<Medicine> getLowStockMedicines() {
        return medicineRepository.findLowStockMedicines();
    }

    @Override
    public List<Medicine> getExpiringMedicines(int days) {
        LocalDate targetDate = LocalDate.now().plusDays(days);
        return medicineRepository.findByExpiryDateBefore(targetDate);
    }

    @Override
    public List<Medicine> getAllMedicines() {
        seedInitialMedicinesIfEmpty();
        return medicineRepository.findAll();
    }

    @Override
    public List<Medicine> searchMedicines(String query) {
        seedInitialMedicinesIfEmpty();
        if (query == null || query.isBlank()) {
            return medicineRepository.findAll();
        }
        return medicineRepository.findByNameContainingIgnoreCaseOrBatchNumberContainingIgnoreCaseOrSupplierNameContainingIgnoreCase(
                query, query, query
        );
    }

    @Override
    public java.util.Map<String, Object> getMedicineDetails(String name) {
        seedInitialMedicinesIfEmpty();
        if (name == null || name.isBlank()) {
            return java.util.Map.of();
        }
        
        String cleanName = name.trim().toLowerCase();
        java.util.Optional<Medicine> match = medicineRepository.findAll().stream()
                .filter(m -> m.getName() != null && m.getName().toLowerCase().contains(cleanName))
                .findFirst();

        String category = "Churna";
        String dosage = "5 g";
        String timing = "Twice Daily (After Food, Warm Water)";
        int durationDays = 14;
        String indication = "Ayurvedic clinical formulation";

        if (match.isPresent()) {
            Medicine m = match.get();
            category = m.getCategory() != null ? m.getCategory() : category;
            if (m.getDescription() != null && !m.getDescription().isBlank()) {
                indication = m.getDescription();
            }
        }

        // Determine category-specific standard Ayurvedic posology defaults
        String lowerCat = category.toLowerCase();
        if (lowerCat.contains("churna")) {
            category = "Churna";
            dosage = "5 g";
            timing = "Twice Daily (After Food with Warm Water/Milk)";
            durationDays = 14;
        } else if (lowerCat.contains("kashaya")) {
            category = "Kashayam";
            dosage = "15 ml";
            timing = "Twice Daily (Before Food mixed with equal warm water)";
            durationDays = 14;
        } else if (lowerCat.contains("vati") || lowerCat.contains("gutika") || lowerCat.contains("guggulu") || lowerCat.contains("tablet")) {
            category = "Vati";
            dosage = "2 Tablets";
            timing = "Twice Daily (After Food with Lukewarm Water)";
            durationDays = 14;
        } else if (lowerCat.contains("ghrita") || lowerCat.contains("ghee")) {
            category = "Ghritam";
            dosage = "1 Teaspoon (5 ml)";
            timing = "Once Daily (Before Sleep with Warm Water)";
            durationDays = 21;
        } else if (lowerCat.contains("taila") || lowerCat.contains("oil")) {
            category = "Tailam";
            dosage = "10 ml (External Application)";
            timing = "Twice Daily (Warm Oil Application & Gentle Massage)";
            durationDays = 14;
        } else if (lowerCat.contains("arishta") || lowerCat.contains("asava")) {
            category = "Arishta";
            dosage = "15 ml";
            timing = "Twice Daily (After Food mixed with 15ml water)";
            durationDays = 14;
        } else if (lowerCat.contains("avaleha")) {
            category = "Avaleha";
            dosage = "1 Teaspoon (10 g)";
            timing = "Twice Daily (After Food with Warm Milk)";
            durationDays = 15;
        }

        java.util.Map<String, Object> result = new java.util.HashMap<>();
        result.put("medicineName", match.map(Medicine::getName).orElse(name));
        result.put("category", category);
        result.put("dosage", dosage);
        result.put("timing", timing);
        result.put("durationDays", durationDays);
        result.put("indication", indication);
        if (match.isPresent()) {
            result.put("mrp", match.get().getMrp());
            result.put("currentStock", match.get().getCurrentStock());
            result.put("unit", match.get().getUnit());
        }
        return result;
    }

    private void seedInitialMedicinesIfEmpty() {
        if (medicineRepository.count() > 0) return;
        
        List<Medicine> seeds = List.of(
            createSeedMed("Ashwagandha Churna", "Churna", "50 packs", 120.0, "Vata balancing, joint stiffness, stress & fatigue relief", 50),
            createSeedMed("Triphala Kashayam", "Kashayam", "200ml bottle", 180.0, "Digestive cleanser, bowel regularity & Pitta-Kapha detox", 45),
            createSeedMed("Dashamoola Ghritam", "Ghritam", "150g jar", 320.0, "Nervine tonic, back pain & Vata disorders", 30),
            createSeedMed("Mahanarayana Tailam", "Tailam", "200ml bottle", 250.0, "Joint stiffness, muscular pain & arthritis massage oil", 60),
            createSeedMed("Chandraprabha Vati", "Vati", "100 tab box", 210.0, "Urinary tract health, diabetes support & metabolic balance", 40),
            createSeedMed("Yogaraja Guggulu", "Vati", "60 tab bottle", 195.0, "Rheumatoid arthritis, joint pain & chronic inflammation", 35),
            createSeedMed("Brahmi Vati", "Vati", "60 tab bottle", 240.0, "Memory enhancement, mental tranquility & insomnia", 30),
            createSeedMed("Kanchanara Guggulu", "Vati", "60 tab bottle", 205.0, "Lymphatic drainage, thyroid support & glandular swellings", 40),
            createSeedMed("Vasavaleha", "Avaleha", "250g jar", 290.0, "Respiratory immunity, chronic cough & asthma relief", 25),
            createSeedMed("Dhanwantharam Tailam", "Tailam", "200ml bottle", 230.0, "Post-natal care, neuromuscular health & Abhyanga oil", 50),
            createSeedMed("Trikatu Churna", "Churna", "100g pack", 110.0, "Digestive fire (Agni) booster & sinus decongestant", 50),
            createSeedMed("Kumkumadi Tailam", "Tailam", "30ml bottle", 450.0, "Skin rejuvenation, complexion enhancer & anti-pigmentation", 20)
        );
        medicineRepository.saveAll(seeds);
    }

    private Medicine createSeedMed(String name, String category, String unit, Double mrp, String desc, int stock) {
        Medicine m = new Medicine();
        m.setName(name);
        m.setCategory(category);
        m.setUnit(unit);
        m.setMrp(mrp);
        m.setWholesalePrice(mrp * 0.7);
        m.setDescription(desc);
        m.setCurrentStock(stock);
        m.setMinimumStockThreshold(10);
        m.setMaximumStockLevel(100);
        m.setBatchNumber("BATCH-" + ((int)(Math.random() * 9000) + 1000));
        m.setSupplierName("AyurPharm Naturals");
        m.setExpiryDate(LocalDate.now().plusYears(2));
        m.calculateStatus();
        return m;
    }

    private void evaluateStockAlert(Medicine medicine) {
        int current = medicine.getCurrentStock() != null ? medicine.getCurrentStock() : 0;
        int min = medicine.getMinimumStockThreshold() != null ? medicine.getMinimumStockThreshold() : 10;

        if (current <= min) {
            // Trigger alert if not already sent
            if (Boolean.FALSE.equals(medicine.getLowStockAlertSent())) {
                medicine.setLowStockAlertSent(true);
                medicineRepository.save(medicine);

                String alertType = current <= Math.max(2, min / 4) ? "CRITICAL_STOCK" : "LOW_STOCK";
                String title = alertType.equals("CRITICAL_STOCK") ? "Critical Stock Alert" : "Low Stock Alert";
                String message = String.format("%s has reached %s level. Current stock: %d (Minimum threshold: %d).",
                        medicine.getName(), alertType.equals("CRITICAL_STOCK") ? "CRITICAL" : "LOW STOCK", current, min);

                // Create in-app notification
                PharmacyNotification notif = new PharmacyNotification(alertType, title, message, medicine.getId(), medicine.getName());
                notificationRepository.save(notif);

                // Send Email to registered Pharmacists
                List<User> pharmacists = userRepository.findByRole(UserRole.PHARMACIST);
                if (pharmacists.isEmpty()) {
                    emailService.sendLowStockAlertEmail("admin@panchakarma.com", medicine.getName(), current, min, medicine.getSupplierName());
                } else {
                    for (User p : pharmacists) {
                        if (p.getEmail() != null) {
                            emailService.sendLowStockAlertEmail(p.getEmail(), medicine.getName(), current, min, medicine.getSupplierName());
                        }
                    }
                }
            }
        } else {
            // Stock recovered above minimum threshold -> reset alert flag
            if (Boolean.TRUE.equals(medicine.getLowStockAlertSent())) {
                medicine.setLowStockAlertSent(false);
                medicineRepository.save(medicine);
            }
        }
    }
}
