package com.panchakarma.management.config;

import com.panchakarma.management.model.User;
import com.panchakarma.management.model.UserRole;
import com.panchakarma.management.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
public class DataInitializer {

    private final PasswordEncoder passwordEncoder;

    public DataInitializer(PasswordEncoder passwordEncoder) {
        this.passwordEncoder = passwordEncoder;
    }

    @Bean
    CommandLineRunner seedUsers(UserRepository userRepository) {
        return args -> {
            if (!userRepository.existsByEmail("admin@panchakarma.com")) {
                userRepository.save(buildUser(
                        "System Admin",
                        "admin@panchakarma.com",
                        "9876543210",
                        "Female",
                        35,
                        UserRole.ADMIN
                ));
            }

            if (!userRepository.existsByEmail("doctor@panchakarma.com")) {
                userRepository.save(buildUser(
                        "Dr. Aryan Sharma",
                        "doctor@panchakarma.com",
                        "9876543211",
                        "Male",
                        42,
                        UserRole.DOCTOR
                ));
            }

            if (!userRepository.existsByEmail("therapist@panchakarma.com")) {
                userRepository.save(buildUser(
                        "Meera Therapist",
                        "therapist@panchakarma.com",
                        "9876543212",
                        "Female",
                        31,
                        UserRole.THERAPIST
                ));
            }

            if (!userRepository.existsByEmail("patient@panchakarma.com")) {
                userRepository.save(buildUser(
                        "Rohan Patient",
                        "patient@panchakarma.com",
                        "9876543213",
                        "Male",
                        29,
                        UserRole.PATIENT
                ));
            }
        };
    }

    private User buildUser(String name, String email, String phone, String gender, Integer age, UserRole role) {
        User user = new User();
        user.setFullName(name);
        user.setEmail(email);
        user.setPhone(phone);
        user.setGender(gender);
        user.setAge(age);
        user.setRole(role);
        user.setPassword(passwordEncoder.encode("Password@123"));
        return user;
    }
}
