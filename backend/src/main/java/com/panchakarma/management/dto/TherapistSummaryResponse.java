package com.panchakarma.management.dto;

import java.time.LocalDateTime;

public record TherapistSummaryResponse(
        Long id,
        String fullName,
        String email,
        String phone,
        String gender,
        Integer age,
        LocalDateTime createdAt
) {
}
