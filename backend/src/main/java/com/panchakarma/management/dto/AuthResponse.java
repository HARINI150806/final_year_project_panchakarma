package com.panchakarma.management.dto;

import com.panchakarma.management.model.UserRole;
import java.time.LocalDateTime;

public record AuthResponse(
        String token,
        Long userId,
        String fullName,
        String email,
        UserRole role,
        boolean doshaAssessmentCompleted,
        String dominantDosha,
        LocalDateTime doshaAssessmentDate,
        boolean profileCompleted
) {
}