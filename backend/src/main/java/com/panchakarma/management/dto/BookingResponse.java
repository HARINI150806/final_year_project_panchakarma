package com.panchakarma.management.dto;

import com.panchakarma.management.model.BookingStatus;
import com.panchakarma.management.model.BookingType;
import com.panchakarma.management.model.ConsultationType;
import com.panchakarma.management.model.PaymentStatus;
import java.time.LocalDate;
import java.time.LocalTime;

public record BookingResponse(
    Long id,
    BookingType type,
    LocalDate date,
    LocalTime time,
    String notes,
    BookingStatus status,
    ConsultationType consultationType,
    String consultationCategory,
    String meetLink,
    TherapistSummaryResponse assignedTo,
    String sessionNotes,
    String patientAdvice,
    Boolean rescheduleRequested,
    LocalDate proposedDate,
    LocalTime proposedTime,
    String rescheduleReason,
    String packageId,
    Integer sessionNumber,
    Integer totalSessions,
    String patientName,
    String patientEmail,
    Boolean altSlotsPending,
    String declineReason,
    LocalDate altSlot1Date,
    LocalTime altSlot1Time,
    LocalDate altSlot2Date,
    LocalTime altSlot2Time,
    LocalDate altSlot3Date,
    LocalTime altSlot3Time,
    PaymentStatus paymentStatus,
    Double paymentAmount,
    String razorpayOrderId,
    String razorpayPaymentId) {
  public record TherapistSummaryResponse(Long id, String fullName) {}
}