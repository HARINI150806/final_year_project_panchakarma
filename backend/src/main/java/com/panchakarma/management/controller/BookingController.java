package com.panchakarma.management.controller;

import com.panchakarma.management.dto.BookingRequest;
import com.panchakarma.management.dto.BookingResponse;
import com.panchakarma.management.model.BookingType;
import com.panchakarma.management.service.BookingService;
import jakarta.validation.Valid;
import java.security.Principal;
import java.util.List;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/bookings")
public class BookingController {

    @Autowired
    private BookingService bookingService;

    @PostMapping
    public ResponseEntity<BookingResponse> createBooking(@RequestBody BookingRequest bookingRequest) {
        return new ResponseEntity<>(bookingService.createBooking(bookingRequest), HttpStatus.CREATED);
    }

    @GetMapping
    public ResponseEntity<List<BookingResponse>> getAllBookings() {
        return new ResponseEntity<>(bookingService.getAllBookings(), HttpStatus.OK);
    }

    @GetMapping("/{id}")
    public ResponseEntity<BookingResponse> getBookingById(@PathVariable Long id) {
        return new ResponseEntity<>(bookingService.getBookingById(id), HttpStatus.OK);
    }

    @PutMapping("/{id}")
    public ResponseEntity<BookingResponse> updateBooking(@PathVariable Long id, @RequestBody BookingRequest bookingRequest) {
        return new ResponseEntity<>(bookingService.updateBooking(id, bookingRequest), HttpStatus.OK);
    }

    @PutMapping("/{id}/session-details")
    public ResponseEntity<BookingResponse> updateSessionDetails(@PathVariable Long id, @RequestBody Map<String, String> payload) {
        String sessionNotes = payload.getOrDefault("sessionNotes", "");
        String patientAdvice = payload.getOrDefault("patientAdvice", "");
        String status = payload.getOrDefault("status", "");
        return ResponseEntity.ok(bookingService.updateSessionDetails(id, sessionNotes, patientAdvice, status));
    }

    @PutMapping("/{id}/reschedule-request")
    public ResponseEntity<BookingResponse> requestReschedule(@PathVariable Long id, @RequestBody Map<String, String> payload) {
        java.time.LocalDate proposedDate = java.time.LocalDate.parse(payload.get("proposedDate"));
        java.time.LocalTime proposedTime = java.time.LocalTime.parse(payload.get("proposedTime"));
        String reason = payload.getOrDefault("reason", "");
        return ResponseEntity.ok(bookingService.requestReschedule(id, proposedDate, proposedTime, reason));
    }

    @PutMapping("/{id}/reschedule-respond")
    public ResponseEntity<BookingResponse> respondReschedule(@PathVariable Long id, @RequestBody Map<String, String> payload) {
        boolean approved = Boolean.parseBoolean(payload.getOrDefault("approved", "false"));
        String declineReason = payload.get("declineReason");
        
        java.time.LocalDate altSlot1Date = payload.get("altSlot1Date") != null && !payload.get("altSlot1Date").isBlank() ? java.time.LocalDate.parse(payload.get("altSlot1Date")) : null;
        java.time.LocalTime altSlot1Time = payload.get("altSlot1Time") != null && !payload.get("altSlot1Time").isBlank() ? java.time.LocalTime.parse(payload.get("altSlot1Time")) : null;
        java.time.LocalDate altSlot2Date = payload.get("altSlot2Date") != null && !payload.get("altSlot2Date").isBlank() ? java.time.LocalDate.parse(payload.get("altSlot2Date")) : null;
        java.time.LocalTime altSlot2Time = payload.get("altSlot2Time") != null && !payload.get("altSlot2Time").isBlank() ? java.time.LocalTime.parse(payload.get("altSlot2Time")) : null;
        java.time.LocalDate altSlot3Date = payload.get("altSlot3Date") != null && !payload.get("altSlot3Date").isBlank() ? java.time.LocalDate.parse(payload.get("altSlot3Date")) : null;
        java.time.LocalTime altSlot3Time = payload.get("altSlot3Time") != null && !payload.get("altSlot3Time").isBlank() ? java.time.LocalTime.parse(payload.get("altSlot3Time")) : null;
        
        return ResponseEntity.ok(bookingService.respondReschedule(id, approved, declineReason,
                altSlot1Date, altSlot1Time, altSlot2Date, altSlot2Time, altSlot3Date, altSlot3Time));
    }

    @PutMapping("/{id}/accept-alternative")
    public ResponseEntity<BookingResponse> acceptAlternativeSlot(@PathVariable Long id, @RequestBody Map<String, Integer> payload) {
        int slotNumber = payload.getOrDefault("slotNumber", 0);
        return ResponseEntity.ok(bookingService.acceptAlternativeSlot(id, slotNumber));
    }

    @PutMapping("/{id}/cancel")
    public ResponseEntity<BookingResponse> cancelBooking(@PathVariable Long id) {
        return ResponseEntity.ok(bookingService.cancelBooking(id));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteBooking(@PathVariable Long id) {
        bookingService.deleteBooking(id);
        return new ResponseEntity<>(HttpStatus.NO_CONTENT);
    }

    @ExceptionHandler(IllegalStateException.class)
    public ResponseEntity<Map<String, String>> handleIllegalStateException(IllegalStateException ex) {
        return new ResponseEntity<>(Map.of("error", ex.getMessage()), HttpStatus.BAD_REQUEST);
    }
}