package com.panchakarma.management.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;

public record TreatmentPlanDto(
    Long id,
    Long patientId,
    String patientName,
    String patientEmail,
    Long prescribedById,
    String prescribedByName,
    Long assignedTherapistId,
    String assignedTherapistName,
    String therapyName,
    Integer totalSessions,
    String frequency,
    LocalDate prescribedStartDate,
    String clinicalNotes,
    String status,
    String packageId,
    LocalDateTime createdAt
) {}
