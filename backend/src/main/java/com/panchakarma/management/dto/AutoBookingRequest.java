package com.panchakarma.management.dto;

import java.time.LocalDate;

public record AutoBookingRequest(
    Long patientId,
    LocalDate preferredDate,
    String reason,
    String notes,
    Long preferredTherapistId,
    Boolean inAppNotifEnabled,
    Boolean emailNotifEnabled
) {}
