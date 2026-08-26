package com.panchakarma.management.controller;

import com.panchakarma.management.dto.AutoBookingRequest;
import com.panchakarma.management.dto.AutoBookingResponse;
import com.panchakarma.management.service.BookingService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/bookings")
public class BookingAutoScheduleController {

    @Autowired
    private BookingService bookingService;

    /**
     * Auto-schedules a consultation with the first available therapist
     */
    @PostMapping("/auto-schedule")
    public ResponseEntity<AutoBookingResponse> autoScheduleConsultation(
            @Valid @RequestBody AutoBookingRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(bookingService.autoScheduleConsultation(request));
    }
}
