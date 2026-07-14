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
    CommandLineRunner seedUsers(UserRepository userRepository, JdbcTemplate jdbcTemplate) {
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