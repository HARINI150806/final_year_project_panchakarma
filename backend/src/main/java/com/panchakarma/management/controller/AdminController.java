package com.panchakarma.management.controller;

import com.panchakarma.management.dto.AdminTherapistRequest;
import com.panchakarma.management.dto.PatientSummaryResponse;
import com.panchakarma.management.dto.TherapistSummaryResponse;
import com.panchakarma.management.model.User;
import com.panchakarma.management.service.AdminService;
import com.panchakarma.management.service.TherapistService;
import java.util.List;
import java.util.stream.Collectors;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final AdminService adminService;
    private final TherapistService therapistService;

    public AdminController(AdminService adminService, TherapistService therapistService) {
        this.adminService = adminService;
        this.therapistService = therapistService;
    }

    @GetMapping("/therapists")
    public ResponseEntity<List<TherapistSummaryResponse>> listTherapists() {
        return ResponseEntity.ok(adminService.listTherapists());
    }

    @GetMapping("/providers")
    public ResponseEntity<List<TherapistSummaryResponse>> listProviders() {
        List<TherapistSummaryResponse> therapists = therapistService.listTherapists().stream()
                .map(user -> new TherapistSummaryResponse(
                        user.getId(),
                        user.getFullName(),
                        user.getEmail(),
                        user.getPhone(),
                        user.getGender(),
                        user.getAge(),
                        user.getCreatedAt()
                ))
                .collect(Collectors.toList());
        return ResponseEntity.ok(therapists);
    }

    @GetMapping("/patients")
    public ResponseEntity<List<PatientSummaryResponse>> listPatients() {
        return ResponseEntity.ok(adminService.listPatients());
    }

    @PostMapping("/therapists")
    public ResponseEntity<TherapistSummaryResponse> createTherapist(@Valid @RequestBody AdminTherapistRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(adminService.createTherapist(request));
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, String>> handleIllegalArgument(IllegalArgumentException exception) {
        return ResponseEntity.badRequest().body(Map.of("message", exception.getMessage()));
    }
}