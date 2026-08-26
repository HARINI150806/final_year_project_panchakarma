package com.panchakarma.management.controller;

import com.panchakarma.management.dto.FollowUpDto;
import com.panchakarma.management.service.FollowUpService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/followups")
public class FollowUpController {

    private final FollowUpService followUpService;

    public FollowUpController(FollowUpService followUpService) {
        this.followUpService = followUpService;
    }

    @PostMapping("/schedule")
    @PreAuthorize("hasAnyAuthority('ROLE_THERAPIST', 'ROLE_ADMIN', 'THERAPIST', 'ADMIN')")
    public ResponseEntity<FollowUpDto.Response> scheduleFollowUp(
            @RequestBody FollowUpDto.ScheduleRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        FollowUpDto.Response response = followUpService.scheduleFollowUp(request, userDetails.getUsername());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/patient")
    public ResponseEntity<List<FollowUpDto.Response>> getMyPatientFollowUps(
            @AuthenticationPrincipal UserDetails userDetails) {
        List<FollowUpDto.Response> list = followUpService.getFollowUpsForPatient(userDetails.getUsername());
        return ResponseEntity.ok(list);
    }

    @GetMapping("/patient/{patientId}")
    public ResponseEntity<List<FollowUpDto.Response>> getFollowUpsForPatientId(
            @PathVariable Long patientId) {
        List<FollowUpDto.Response> list = followUpService.getFollowUpsForPatientId(patientId);
        return ResponseEntity.ok(list);
    }

    @GetMapping("/therapist")
    public ResponseEntity<List<FollowUpDto.Response>> getMyTherapistFollowUps(
            @AuthenticationPrincipal UserDetails userDetails) {
        List<FollowUpDto.Response> list = followUpService.getFollowUpsForTherapist(userDetails.getUsername());
        return ResponseEntity.ok(list);
    }

    @PostMapping("/{id}/complete")
    @PreAuthorize("hasAnyAuthority('ROLE_THERAPIST', 'ROLE_ADMIN', 'THERAPIST', 'ADMIN')")
    public ResponseEntity<FollowUpDto.Response> recordObservation(
            @PathVariable Long id,
            @RequestBody FollowUpDto.ObservationRequest request) {
        FollowUpDto.Response response = followUpService.recordObservation(id, request);
        return ResponseEntity.ok(response);
    }
}
