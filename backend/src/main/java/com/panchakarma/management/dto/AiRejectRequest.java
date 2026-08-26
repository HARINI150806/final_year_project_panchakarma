package com.panchakarma.management.dto;

/** Request from senior therapist to reject an AI suggestion */
public record AiRejectRequest(
        String rejectionReason  // Reason shown to patient
) {}
