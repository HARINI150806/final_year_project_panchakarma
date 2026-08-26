package com.panchakarma.management.dto;

/** Request from senior therapist to approve or modify an AI suggestion */
public record AiApproveRequest(
        String finalTherapy,    // Confirmed or modified therapy name
        String therapistNotes   // Optional notes for patient
) {}
