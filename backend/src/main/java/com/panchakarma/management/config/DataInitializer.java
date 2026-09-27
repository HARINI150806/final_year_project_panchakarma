package com.panchakarma.management.config;

import com.panchakarma.management.model.Medicine;
import com.panchakarma.management.model.User;
import com.panchakarma.management.model.UserRole;
import com.panchakarma.management.repository.MedicineRepository;
import com.panchakarma.management.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDate;
import java.util.List;

@Configuration
public class DataInitializer {

    private final PasswordEncoder passwordEncoder;

    public DataInitializer(PasswordEncoder passwordEncoder) {
        this.passwordEncoder = passwordEncoder;
    }

    @Bean
    CommandLineRunner seedData(UserRepository userRepository, MedicineRepository medicineRepository, JdbcTemplate jdbcTemplate) {
        return args -> {
            // Drop legacy PostgreSQL role check constraint if present to allow UserRole.PHARMACIST
            try {
                jdbcTemplate.execute("ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;");
            } catch (Exception e) {
                // Ignore if constraint is absent
            }

            // Drop non-cascading legacy foreign key on notifications table if present
            try {
                jdbcTemplate.execute("ALTER TABLE notifications DROP CONSTRAINT IF EXISTS fk9y21adhxn0ayjhfocscqox7bh;");
            } catch (Exception e) {
                // Ignore if constraint is absent
            }

            // 1. Seed Admin User if missing
            if (!userRepository.existsByEmail("admin@panchakarma.com")) {
                userRepository.save(buildUser(
                        "System Admin",
                        "admin@panchakarma.com",
                        "9876543210",
                        "Female",
                        35,
                        UserRole.ADMIN));
            }

            // 2. Seed Therapist / Doctor User if missing
            if (!userRepository.existsByEmail("therapist@panchakarma.com")) {
                userRepository.save(buildUser(
                        "Dr. Ananya Sharma",
                        "therapist@panchakarma.com",
                        "9876543211",
                        "Female",
                        38,
                        UserRole.THERAPIST));
            }

            // 3. Seed Patient User if missing
            if (!userRepository.existsByEmail("patient@panchakarma.com")) {
                userRepository.save(buildUser(
                        "Rahul Verma",
                        "patient@panchakarma.com",
                        "9876543212",
                        "Male",
                        29,
                        UserRole.PATIENT));
            }

            // 4. Seed Pharmacist User if missing
            if (!userRepository.existsByEmail("pharmacist@panchakarma.com")) {
                userRepository.save(buildUser(
                        "Suresh Kumar",
                        "pharmacist@panchakarma.com",
                        "9876543213",
                        "Male",
                        42,
                        UserRole.PHARMACIST));
            }

            // 5. Seed Initial Pharmacy Medicines if database is empty
            if (medicineRepository.count() == 0) {
                Medicine m1 = buildMedicine("Mahanarayana Thailam", "Taila", "Kottakkal Arya Vaidya Sala", "MNT-2026-01", 45, 10, "200ml bottle", 350.0, "Classic Ayurvedic oil for joint pain and Abhyanga therapy.");
                Medicine m2 = buildMedicine("Dhanwantharam Thailam", "Taila", "AVP Ayurveda Pharmacy", "DNT-2026-02", 30, 10, "200ml bottle", 380.0, "Vata balancing oil used in Post-natal and Panchakarma care.");
                Medicine m3 = buildMedicine("Ksheerabala 101 Capsules", "Capsules", "Kerala Ayurveda Ltd", "KSR-2026-03", 50, 15, "60 caps bottle", 420.0, "Nervine tonic and neuromuscular care softgels.");
                Medicine m4 = buildMedicine("Triphala Churna", "Churna", "Baidyanath Pharmacy", "TPC-2026-04", 60, 20, "100g pack", 120.0, "Traditional digestive and Samsarjana Krama detox powder.");
                Medicine m5 = buildMedicine("Ashwagandharishta", "Arishta", "Dabur India Ltd", "ASW-2026-05", 25, 10, "450ml bottle", 260.0, "Fermented herbal tonic for stress relief and vitality.");
                Medicine m6 = buildMedicine("Brahmi Vati", "Gulika", "Himalaya Wellness", "BRM-2026-06", 8, 15, "60 tab bottle", 180.0, "Memory and cognitive wellness Ayurvedic tablets.");

                medicineRepository.saveAll(List.of(m1, m2, m3, m4, m5, m6));
            }
        };
    }

    private User buildUser(String fullName, String email, String phone, String gender, Integer age, UserRole role) {
        User u = new User();
        u.setFullName(fullName);
        u.setEmail(email);
        u.setPassword(passwordEncoder.encode("Password123!"));
        u.setPhone(phone);
        u.setGender(gender);
        u.setAge(age);
        u.setRole(role);
        return u;
    }

    private Medicine buildMedicine(String name, String category, String supplier, String batch, int stock, int threshold, String unit, double mrp, String desc) {
        Medicine m = new Medicine();
        m.setName(name);
        m.setCategory(category);
        m.setSupplierName(supplier);
        m.setBatchNumber(batch);
        m.setCurrentStock(stock);
        m.setMinimumStockThreshold(threshold);
        m.setUnit(unit);
        m.setMrp(mrp);
        m.setWholesalePrice(mrp * 0.8);
        m.setManufacturingDate(LocalDate.now().minusMonths(2));
        m.setExpiryDate(LocalDate.now().plusYears(2));
        m.setDescription(desc);
        return m;
    }
}