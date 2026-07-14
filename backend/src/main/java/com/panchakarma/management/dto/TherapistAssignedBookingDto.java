package com.panchakarma.management.dto;

import java.time.LocalDate;

public record TherapistAssignedBookingDto(
    Long bookingId,
    String patientFullName,
    String therapyPurpose,
    LocalDate bookingDate,
    String bookingStatus
) {}