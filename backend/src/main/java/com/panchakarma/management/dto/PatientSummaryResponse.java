package com.panchakarma.management.dto;

import java.time.LocalDateTime;

public record PatientSummaryResponse(
        Long id,
        String fullName,
        String email,
        String phone,
        String gender,
        Integer age,
        String dominantDosha,
        boolean doshaAssessmentCompleted,
        LocalDateTime createdAt
) {
}
