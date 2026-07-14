package com.panchakarma.management.dto;

import com.panchakarma.management.model.UserRole;
import java.time.LocalDateTime;
import java.util.List;

public record PatientProfileResponse(
        Long userId,
        String fullName,
        String email,
        String phone,
        UserRole role,
        Integer age,
        String gender,
        String height,
        String weight,
        String occupation,
        String bodyBuild,
        String skinType,
        String appetite,
        String digestion,
        String sleepPattern,
        String energyLevel,
        String stressResponse,
        String climatePreference,
        String walkingStyle,
        String personality,
        Integer vataScore,
        Integer pittaScore,
        Integer kaphaScore,
        String dominantDosha,
        boolean doshaAssessmentCompleted,
        LocalDateTime doshaAssessmentDate,
        List<String> recommendedTherapies
) {
}