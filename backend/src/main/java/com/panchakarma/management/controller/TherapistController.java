package com.panchakarma.management.controller;

import com.panchakarma.management.dto.BookingResponse;
import com.panchakarma.management.dto.PatientSummaryResponse;
import com.panchakarma.management.dto.TherapistAssignedBookingDto;
import com.panchakarma.management.dto.TherapistSummaryResponse;
import com.panchakarma.management.service.AdminService;
import com.panchakarma.management.service.TherapistService;
import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/therapists")
public class TherapistController {

    private final AdminService adminService;
    private final TherapistService therapistService;

    public TherapistController(AdminService adminService, TherapistService therapistService) {
        this.adminService = adminService;
        this.therapistService = therapistService;
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
}