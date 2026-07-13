package com.panchakarma.management.controller;

import com.panchakarma.management.dto.DashboardStatsResponse;
import com.panchakarma.management.model.UserRole;
import com.panchakarma.management.repository.UserRepository;
import com.panchakarma.management.service.DashboardService;
import java.security.Principal;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class DashboardController {

    private final DashboardService dashboardService;
    private final UserRepository userRepository;

    @GetMapping("/dashboard")
    public ResponseEntity<DashboardStatsResponse> getDashboard(Principal principal) {
        UserRole role = userRepository.findByEmail(principal.getName())
                .map(user -> user.getRole())
                .orElse(UserRole.PATIENT);
        return ResponseEntity.ok(dashboardService.buildDashboard(role));
    }
}
