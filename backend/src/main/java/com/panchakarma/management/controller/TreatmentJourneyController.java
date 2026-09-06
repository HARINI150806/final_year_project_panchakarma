package com.panchakarma.management.controller;

import com.panchakarma.management.dto.TreatmentJourneyResponse;
import com.panchakarma.management.service.TreatmentJourneyService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;

@RestController
@RequestMapping("/api/patient/treatment-journey")
public class TreatmentJourneyController {

    private final TreatmentJourneyService treatmentJourneyService;

    public TreatmentJourneyController(TreatmentJourneyService treatmentJourneyService) {
        this.treatmentJourneyService = treatmentJourneyService;
    }

    @GetMapping
    public ResponseEntity<TreatmentJourneyResponse> getMyTreatmentJourney(Principal principal) {
        String username = null;
        if (principal != null) {
            username = principal.getName();
        } else if (SecurityContextHolder.getContext().getAuthentication() != null) {
            username = SecurityContextHolder.getContext().getAuthentication().getName();
        }

        if (username == null || username.isBlank() || "anonymousUser".equalsIgnoreCase(username)) {
            return ResponseEntity.status(401).build();
        }

        TreatmentJourneyResponse response = treatmentJourneyService.getJourneyForPatientUsername(username);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{patientId}")
    public ResponseEntity<TreatmentJourneyResponse> getTreatmentJourneyForPatient(
            @PathVariable Long patientId) {
        TreatmentJourneyResponse response = treatmentJourneyService.getJourneyForPatient(patientId);
        return ResponseEntity.ok(response);
    }
}
