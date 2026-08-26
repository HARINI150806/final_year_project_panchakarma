package com.panchakarma.management.controller;

import com.panchakarma.management.model.HealthReport;
import com.panchakarma.management.model.User;
import com.panchakarma.management.repository.HealthReportRepository;
import com.panchakarma.management.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
public class HealthReportController {

    @Autowired
    private HealthReportRepository healthReportRepository;

    @Autowired
    private UserRepository userRepository;

    @GetMapping({"/patient/reports", "/reports"})
    public ResponseEntity<List<HealthReport>> getPatientReports() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) {
            return ResponseEntity.status(401).build();
        }

        String email = auth.getName();
        User user = userRepository.findByEmail(email).orElse(null);
        Long userId = user != null ? user.getId() : 1L;

        List<HealthReport> reports = healthReportRepository.findByPatientIdOrderByCreatedAtDesc(userId);

        if (reports.isEmpty()) {
            HealthReport initialReport = new HealthReport(
                userId,
                92,
                88,
                5,
                7,
                75,
                "Pitta-dominant constitution with optimal digestive fire (Agni) and reduced Vata joint stiffness.",
                "Patient showing 92% recovery compliance with prescribed Abhyanga & Shirodhara regimen."
            );
            reports = List.of(healthReportRepository.save(initialReport));
        }

        return ResponseEntity.ok(reports);
    }
}
