package com.panchakarma.management.controller;

import com.panchakarma.management.model.Prescription;
import com.panchakarma.management.model.PrescriptionMedicine;
import com.panchakarma.management.model.User;
import com.panchakarma.management.repository.PrescriptionRepository;
import com.panchakarma.management.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@RestController
@RequestMapping("/api")
public class PrescriptionController {

    @Autowired
    private PrescriptionRepository prescriptionRepository;

    @Autowired
    private UserRepository userRepository;

    @GetMapping({"/patient/prescriptions", "/prescriptions"})
    public ResponseEntity<List<Prescription>> getPatientPrescriptions() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) {
            return ResponseEntity.status(401).build();
        }

        String email = auth.getName();
        User user = userRepository.findByEmail(email).orElse(null);
        if (user == null) {
            return ResponseEntity.ok(java.util.Collections.emptyList());
        }

        List<Prescription> prescriptions = prescriptionRepository.findByPatientIdOrderByCreatedAtDesc(user.getId());

        // Filter out legacy dummy test prescriptions
        List<Prescription> realPrescriptions = prescriptions.stream()
                .filter(p -> p.getDoctorName() == null || !p.getDoctorName().contains("Dr. Meena"))
                .toList();

        return ResponseEntity.ok(realPrescriptions);
    }

    @GetMapping({"/patient/prescriptions/{id}", "/prescriptions/{id}"})
    public ResponseEntity<Prescription> getPrescriptionById(@PathVariable Long id) {
        return prescriptionRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping({"/patient/prescriptions", "/prescriptions"})
    public ResponseEntity<Prescription> createPrescription(@RequestBody Prescription prescription) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.isAuthenticated()) {
            String email = auth.getName();
            userRepository.findByEmail(email).ifPresent(u -> {
                if (prescription.getDoctorName() == null || prescription.getDoctorName().isEmpty()) {
                    prescription.setDoctorName(u.getFullName() + ", BAMS");
                }
            });
        }

        if (prescription.getPatientId() == null) {
            prescription.setPatientId(1L);
        }

        if (prescription.getMedicineName() == null || prescription.getMedicineName().isEmpty()) {
            if (prescription.getTherapyName() != null && !prescription.getTherapyName().isEmpty()) {
                prescription.setMedicineName(prescription.getTherapyName());
            } else if (prescription.getMedicines() != null && !prescription.getMedicines().isEmpty()) {
                prescription.setMedicineName(prescription.getMedicines().get(0).getMedicineName());
            } else {
                prescription.setMedicineName("Panchakarma Formulation");
            }
        }

        // Link medicines bidirectionally
        if (prescription.getMedicines() != null) {
            for (PrescriptionMedicine m : prescription.getMedicines()) {
                m.setPrescription(prescription);
            }
        }

        if (prescription.getStatus() == null || "GENERATED".equalsIgnoreCase(prescription.getStatus())) {
            prescription.setStatus("PENDING");
        }

        Prescription saved = prescriptionRepository.save(prescription);
        return ResponseEntity.ok(saved);
    }
}
