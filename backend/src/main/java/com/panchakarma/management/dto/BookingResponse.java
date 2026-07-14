package com.panchakarma.management.dto;

import com.panchakarma.management.model.BookingStatus;
import com.panchakarma.management.model.BookingType;
import java.time.LocalDate;
import java.time.LocalTime;

public record BookingResponse(
    Long id,
    BookingType type,
    LocalDate date,
    LocalTime time,
    String notes,
    BookingStatus status,
    TherapistSummaryResponse assignedTo) {
  public record TherapistSummaryResponse(Long id, String fullName) {}
}