package com.panchakarma.management.dto;

import java.time.LocalDate;
import java.time.LocalTime;

public record TherapistAssignedBookingDto(
    Long bookingId,
    String patientFullName,
    String therapyName,
    String therapyDescription,
    String therapyDuration,
    LocalDate bookingDate,
    LocalTime bookingTime,
    String bookingStatus
) {}