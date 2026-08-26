package com.panchakarma.management.controller;

import com.panchakarma.management.model.SamsarjanaPlan;
import com.panchakarma.management.repository.SamsarjanaRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/samsarjana")
public class SamsarjanaController {

    @Autowired
    private SamsarjanaRepository samsarjanaRepository;

    @GetMapping("/patient/{patientId}")
    public ResponseEntity<?> getPatientPlan(@PathVariable Long patientId) {
        Optional<SamsarjanaPlan> activePlan = samsarjanaRepository.findFirstByPatientIdAndStatus(patientId, "ACTIVE");
        if (activePlan.isPresent()) {
            return ResponseEntity.ok(activePlan.get());
        }
        List<SamsarjanaPlan> allPlans = samsarjanaRepository.findByPatientIdOrderByCreatedAtDesc(patientId);
        if (!allPlans.isEmpty()) {
            return ResponseEntity.ok(allPlans.get(0));
        }
        return ResponseEntity.ok(Map.of("message", "No active recovery plan found"));
    }

    @PostMapping("/assign")
    public ResponseEntity<SamsarjanaPlan> assignPlan(@RequestBody Map<String, Object> payload) {
        Long patientId = Long.valueOf(payload.get("patientId").toString());
        String patientName = payload.getOrDefault("patientName", "Patient").toString();
        String therapyName = payload.getOrDefault("therapyName", "Panchakarma Therapy").toString();
        Integer totalDays = payload.get("totalDays") != null ? Integer.parseInt(payload.get("totalDays").toString()) : 5;
        String doctorName = payload.getOrDefault("assignedByDoctorName", "Dr. Vaidya").toString();

        // Deactivate previous active plans if any
        samsarjanaRepository.findFirstByPatientIdAndStatus(patientId, "ACTIVE").ifPresent(plan -> {
            plan.setStatus("COMPLETED");
            samsarjanaRepository.save(plan);
        });

        SamsarjanaPlan plan = new SamsarjanaPlan();
        plan.setPatientId(patientId);
        plan.setPatientName(patientName);
        plan.setTherapyName(therapyName);
        plan.setTotalDays(totalDays);
        plan.setCurrentDay(1);
        plan.setStartDate(LocalDate.now());
        plan.setStatus("ACTIVE");
        plan.setAssignedByDoctorName(doctorName);

        return ResponseEntity.ok(samsarjanaRepository.save(plan));
    }

    @PutMapping("/{id}/log-day")
    public ResponseEntity<SamsarjanaPlan> logDay(@PathVariable Long id) {
        SamsarjanaPlan plan = samsarjanaRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Plan not found"));
        if (plan.getCurrentDay() < plan.getTotalDays()) {
            plan.setCurrentDay(plan.getCurrentDay() + 1);
        } else {
            plan.setStatus("COMPLETED");
        }
        return ResponseEntity.ok(samsarjanaRepository.save(plan));
    }
}
