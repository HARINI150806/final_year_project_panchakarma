package com.panchakarma.management.dto;

import java.time.LocalDate;
import java.time.LocalTime;

public record AutoBookingRequest(
    Long patientId,
    LocalDate preferredDate,
    LocalTime preferredTime,
    String reason,
    String notes,
    Long preferredTherapistId,
    Boolean inAppNotifEnabled,
    Boolean emailNotifEnabled
) {}
