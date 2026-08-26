package com.panchakarma.management.dto;

import com.panchakarma.management.model.ConsultationType;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.LocalDateTime;

public record WalletTransactionDto(
    Long bookingId,
    Long patientId,
    String patientName,
    String patientEmail,
    LocalDate date,
    LocalTime time,
    String purpose,
    Double amount,
    String paymentStatus,
    String razorpayPaymentId,
    String razorpayOrderId,
    ConsultationType consultationType,
    LocalDateTime createdAt
) {}
