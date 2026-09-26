package com.panchakarma.management.config;

import com.panchakarma.management.model.User;
import com.panchakarma.management.model.UserRole;
import com.panchakarma.management.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
public class DataInitializer {

    private final PasswordEncoder passwordEncoder;

    public DataInitializer(PasswordEncoder passwordEncoder) {
        this.passwordEncoder = passwordEncoder;
    }

    @Bean
    CommandLineRunner seedData(UserRepository userRepository, JdbcTemplate jdbcTemplate) {
        return args -> {
            // Drop legacy PostgreSQL role check constraint if present to allow UserRole.PHARMACIST
            try {
                jdbcTemplate.execute("ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;");
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

            // 2. Seed Therapist User if missing
            if (!userRepository.existsByEmail("therapist@panchakarma.com")) {
                User therapist = buildUser(
                        "Lead Therapist",
                        "therapist@panchakarma.com",
                        "9876543211",
                        "Female",
                        32,
                        UserRole.THERAPIST);
                therapist.setSeniorTherapist(true);
                userRepository.save(therapist);
            }

            // 3. Seed Patient User if missing
            if (!userRepository.existsByEmail("patient@panchakarma.com")) {
                userRepository.save(buildUser(
                        "Panchakarma Patient",
                        "patient@panchakarma.com",
                        "9876543212",
                        "Female",
                        35,
                        UserRole.PATIENT));
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
}