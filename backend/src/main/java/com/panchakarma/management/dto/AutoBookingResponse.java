package com.panchakarma.management.dto;

import com.panchakarma.management.model.PaymentStatus;
import java.time.LocalDate;
import java.time.LocalTime;

public record AutoBookingResponse(
    Long bookingId,
    Long therapistId,
    String therapistName,
    LocalDate date,
    LocalTime startTime,
    LocalTime endTime,
    String meetLink,
    String message,
    PaymentStatus paymentStatus,
    Double paymentAmount,
    String razorpayOrderId,
    String razorpayPaymentId
) {}
