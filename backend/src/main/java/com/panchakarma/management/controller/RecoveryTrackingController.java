package com.panchakarma.management.controller;

import com.panchakarma.management.dto.RecoverySummaryDto;
import com.panchakarma.management.dto.SaveRecoveryAssessmentRequest;
import com.panchakarma.management.service.RecoveryTrackingService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/recovery")
@RequiredArgsConstructor
public class RecoveryTrackingController {

    private final RecoveryTrackingService recoveryTrackingService;

    @PostMapping("/assessment")
    @PreAuthorize("hasAnyRole('THERAPIST', 'ADMIN', 'PATIENT')")
    public ResponseEntity<RecoverySummaryDto> saveAssessment(
            @RequestBody SaveRecoveryAssessmentRequest request,
            Authentication authentication) {
        String email = authentication != null ? authentication.getName() : null;
        RecoverySummaryDto summary = recoveryTrackingService.saveAssessment(request, email);
        return ResponseEntity.ok(summary);
    }

    @GetMapping("/plan/{therapyPlanId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<RecoverySummaryDto> getSummaryForPlan(@PathVariable Long therapyPlanId) {
        RecoverySummaryDto summary = recoveryTrackingService.getRecoverySummaryForPlan(therapyPlanId);
        if (summary == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(summary);
    }

    @GetMapping("/patient/{patientId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<RecoverySummaryDto> getSummaryForPatient(@PathVariable Long patientId) {
        RecoverySummaryDto summary = recoveryTrackingService.getLatestRecoverySummaryForPatient(patientId);
        if (summary == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(summary);
    }
}
