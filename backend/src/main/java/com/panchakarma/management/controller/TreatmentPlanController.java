package com.panchakarma.management.controller;

import com.panchakarma.management.dto.ScheduleTreatmentPlanRequest;
import com.panchakarma.management.dto.TreatmentPlanDto;
import com.panchakarma.management.exception.ResourceNotFoundException;
import com.panchakarma.management.model.User;
import com.panchakarma.management.repository.UserRepository;
import com.panchakarma.management.service.TreatmentPlanService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/treatment-plans")
public class TreatmentPlanController {

    private final TreatmentPlanService treatmentPlanService;
    private final UserRepository userRepository;

    public TreatmentPlanController(TreatmentPlanService treatmentPlanService, UserRepository userRepository) {
        this.treatmentPlanService = treatmentPlanService;
        this.userRepository = userRepository;
    }

    @PostMapping
    public ResponseEntity<TreatmentPlanDto> createTreatmentPlan(@RequestBody TreatmentPlanDto dto) {
        return ResponseEntity.ok(treatmentPlanService.createTreatmentPlan(dto));
    }

    @GetMapping("/patient/{patientId}")
    public ResponseEntity<List<TreatmentPlanDto>> getTreatmentPlansByPatientId(@PathVariable Long patientId) {
        return ResponseEntity.ok(treatmentPlanService.getTreatmentPlansByPatientId(patientId));
    }

    @GetMapping("/my")
    public ResponseEntity<List<TreatmentPlanDto>> getMyTreatmentPlans(Principal principal) {
        if (principal == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        User user = userRepository.findByEmail(principal.getName())
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + principal.getName()));
        return ResponseEntity.ok(treatmentPlanService.getTreatmentPlansByPatientId(user.getId()));
    }

    @GetMapping
    public ResponseEntity<List<TreatmentPlanDto>> getAllTreatmentPlans() {
        return ResponseEntity.ok(treatmentPlanService.getAllTreatmentPlans());
    }

    @PostMapping("/{planId}/schedule")
    public ResponseEntity<TreatmentPlanDto> scheduleTreatmentPlan(
            @PathVariable Long planId,
            @RequestBody ScheduleTreatmentPlanRequest request) {
        return ResponseEntity.ok(treatmentPlanService.scheduleTreatmentPlan(planId, request));
    }
}

