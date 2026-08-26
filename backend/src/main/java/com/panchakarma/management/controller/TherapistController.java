package com.panchakarma.management.controller;

import com.panchakarma.management.dto.TherapistSummaryResponse;
import com.panchakarma.management.dto.TherapistAssignedBookingDto;
import com.panchakarma.management.dto.PatientSummaryResponse;
import com.panchakarma.management.dto.TherapistWeeklyScheduleDto;
import com.panchakarma.management.dto.TherapistDateOverrideDto;
import com.panchakarma.management.model.TherapistAvailability;
import com.panchakarma.management.service.AdminService;
import com.panchakarma.management.service.TherapistService;
import com.panchakarma.management.service.AvailabilityService;

import com.panchakarma.management.model.Prescription;
import com.panchakarma.management.repository.PrescriptionRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/therapists")
public class TherapistController {

    private final AdminService adminService;
    private final TherapistService therapistService;
    private final AvailabilityService availabilityService;
    private final PrescriptionRepository prescriptionRepository;

    public TherapistController(
            AdminService adminService, 
            TherapistService therapistService, 
            AvailabilityService availabilityService,
            PrescriptionRepository prescriptionRepository) {
        this.adminService = adminService;
        this.therapistService = therapistService;
        this.availabilityService = availabilityService;
        this.prescriptionRepository = prescriptionRepository;
    }

    @GetMapping("/prescriptions")
    public ResponseEntity<List<Prescription>> getTherapistPrescriptions() {
        List<Prescription> all = prescriptionRepository.findAll();
        all.sort((a, b) -> {
            if (a.getCreatedAt() != null && b.getCreatedAt() != null) {
                return b.getCreatedAt().compareTo(a.getCreatedAt());
            }
            return b.getId().compareTo(a.getId());
        });
        return ResponseEntity.ok(all);
    }

    @GetMapping
    public ResponseEntity<List<TherapistSummaryResponse>> listTherapists() {
        return ResponseEntity.ok(adminService.listTherapists());
    }

    @GetMapping("/my-bookings")
    public ResponseEntity<List<TherapistAssignedBookingDto>> getMyBookings() {
        return ResponseEntity.ok(therapistService.getMyBookings());
    }

    @GetMapping("/my-patients")
    public ResponseEntity<List<PatientSummaryResponse>> getMyPatients() {
        return ResponseEntity.ok(therapistService.getMyPatients());
    }

    @GetMapping("/wallet")
    public ResponseEntity<com.panchakarma.management.dto.TherapistWalletDto> getWallet() {
        return ResponseEntity.ok(therapistService.getTherapistWallet());
    }

    @GetMapping("/patients/{patientId}/therapies")
    public ResponseEntity<List<TherapistAssignedBookingDto>> getAssignedBookingsForPatient(@PathVariable Long patientId) {
        return ResponseEntity.ok(therapistService.getAssignedBookingsForPatient(patientId));
    }

    // Weekly Schedule Template
    @GetMapping("/weekly-schedule")
    public ResponseEntity<List<TherapistWeeklyScheduleDto>> getWeeklySchedule() {
        return ResponseEntity.ok(therapistService.getMyWeeklySchedule());
    }

    @PutMapping("/weekly-schedule")
    public ResponseEntity<List<TherapistWeeklyScheduleDto>> updateWeeklySchedule(
            @RequestBody List<TherapistWeeklyScheduleDto> schedules) {
        return ResponseEntity.ok(therapistService.updateMyWeeklySchedule(schedules));
    }

    // Date Overrides
    @GetMapping("/date-overrides")
    public ResponseEntity<List<TherapistDateOverrideDto>> getDateOverrides() {
        return ResponseEntity.ok(therapistService.getMyDateOverrides());
    }

    @PostMapping("/date-overrides")
    public ResponseEntity<TherapistDateOverrideDto> createOrUpdateDateOverride(
            @RequestBody TherapistDateOverrideDto override) {
        return ResponseEntity.ok(therapistService.createOrUpdateDateOverride(override));
    }

    @DeleteMapping("/date-overrides/{id}")
    public ResponseEntity<Void> deleteDateOverride(@PathVariable Long id) {
        therapistService.deleteDateOverride(id);
        return ResponseEntity.noContent().build();
    }

    // Diagnostic availability endpoint for a therapist on a date
    @GetMapping("/{therapistId}/availability")
    public ResponseEntity<List<TherapistAvailability>> getTherapistAvailabilityOnDate(
            @PathVariable Long therapistId,
            @RequestParam String date) {
        LocalDate localDate = LocalDate.parse(date);
        
        if (therapistId == null || therapistId == 0) {
            return ResponseEntity.ok(availabilityService.getAllTherapistsAvailabilityOnDate(localDate));
        }

        var therapist = adminService.listTherapists().stream()
                .filter(t -> t.id().equals(therapistId))
                .findFirst();
        
        if (therapist.isEmpty()) {
            // Fall back to aggregated slots across available therapists if therapist ID not found
            return ResponseEntity.ok(availabilityService.getAllTherapistsAvailabilityOnDate(localDate));
        }

        // Just fetch the next 30 days slots and filter for requested date
        List<TherapistAvailability> allSlots = availabilityService.getTherapistAvailability(therapistId);
        List<TherapistAvailability> filtered = allSlots.stream()
                .filter(slot -> slot.getAvailableDate().equals(localDate))
                .collect(Collectors.toList());

        return ResponseEntity.ok(filtered);
    }

    @GetMapping("/availability")
    public ResponseEntity<List<TherapistAvailability>> getGeneralAvailabilityOnDate(@RequestParam String date) {
        LocalDate localDate = LocalDate.parse(date);
        return ResponseEntity.ok(availabilityService.getAllTherapistsAvailabilityOnDate(localDate));
    }
}