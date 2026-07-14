package com.panchakarma.management.dto;

import com.panchakarma.management.model.BookingType;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalTime;

@Data
public class PatientBookingRequest {
    private LocalDate date;
    private LocalTime time;
    private String notes; // Corresponds to 'purpose' in BookingRequest
    private BookingType type; // Corresponds to 'bookingType' in BookingRequest
    private Long assignedTo; // Corresponds to 'assignedToId' in BookingRequest
}