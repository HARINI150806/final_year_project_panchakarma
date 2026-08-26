package com.panchakarma.management.dto;

import java.time.LocalDateTime;

public record PharmacistSummaryResponse(
        Long id,
        String fullName,
        String email,
        String phone,
        String gender,
        Integer age,
        String pharmacyName,
        LocalDateTime createdAt
) {}
