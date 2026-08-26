package com.panchakarma.management.dto;

import com.panchakarma.management.model.ConsultationType;
import java.time.LocalDate;
import java.time.LocalTime;

public record VerifyPaymentRequest(
    String razorpayOrderId,
    String razorpayPaymentId,
    String razorpaySignature,
    Long patientId,
    ConsultationType consultationType,
    String consultationCategory,
    LocalDate date,
    LocalTime time,
    String reason,
    String notes,
    Long assignedToId,
    Boolean inAppNotifEnabled,
    Boolean emailNotifEnabled
) {}
