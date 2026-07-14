package com.panchakarma.management.controller;

import com.panchakarma.management.dto.PatientProfileRequest;
import com.panchakarma.management.exception.ResourceNotFoundException;
import com.panchakarma.management.service.PatientProfileService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import com.panchakarma.management.model.Patient;
import com.panchakarma.management.model.User; // Import the User model
import com.panchakarma.management.repository.UserRepository;

@RestController
@RequestMapping("/api/patient/profile")
public class PatientProfileController {

    @Autowired
    private PatientProfileService patientProfileService;
    @Autowired
    private UserRepository userRepository;

    // Endpoint for ADMIN/THERAPIST to update any patient's profile

    @PutMapping("/{patientId}")
    public ResponseEntity<Void> updatePatientProfile(@PathVariable Long patientId, @RequestBody PatientProfileRequest patientProfileRequest) {
        patientProfileService.updatePatientProfile(patientId, patientProfileRequest);
        return ResponseEntity.ok().build();
    }

    // Endpoint for authenticated PATIENT to update their own profile
    @PutMapping
    public ResponseEntity<Void> updateMyProfile(@RequestBody PatientProfileRequest patientProfileRequest) {
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        String username;
        if (principal instanceof org.springframework.security.core.userdetails.UserDetails) {
            username = ((org.springframework.security.core.userdetails.UserDetails) principal).getUsername();
        } else {
            username = principal.toString();
        }

        User authenticatedUser = userRepository.findByEmail(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + username));

        Long patientId = authenticatedUser.getPatient().getId(); // Assuming User has a Patient association
        patientProfileService.updatePatientProfile(patientId, patientProfileRequest);
        return ResponseEntity.ok().build();
    }

    // Endpoint for authenticated PATIENT to get their own profile
    @GetMapping
    public ResponseEntity<Patient> getMyProfile() {
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        String username;
        if (principal instanceof org.springframework.security.core.userdetails.UserDetails) {
            username = ((org.springframework.security.core.userdetails.UserDetails) principal).getUsername();
        } else {
            username = principal.toString();
        }

        User authenticatedUser = userRepository.findByEmail(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + username));

        Patient patient = authenticatedUser.getPatient();
        if (patient == null) {
            throw new ResourceNotFoundException("Patient profile not found for user: " + username);
        }
        return ResponseEntity.ok(patient);
    }
}