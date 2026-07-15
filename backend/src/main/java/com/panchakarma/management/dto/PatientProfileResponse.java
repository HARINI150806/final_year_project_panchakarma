package com.panchakarma.management.dto;

import com.panchakarma.management.model.UserRole;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

public record PatientProfileResponse(
        Long patientId,
        Long userId,
        String firstName,
        String lastName,
        String fullName,
        String email,
        String phone,
        UserRole role,
        LocalDate dateOfBirth,
        Integer age,
        String gender,
        String height,
        String weight,
        String occupation,
        boolean profileCompleted,
        List<ProfileItemResponse> healthConditions,
        List<ProfileItemResponse> allergies,
        List<ProfileItemResponse> previousTreatments,
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
    public record ProfileItemResponse(
            Long id,
            String name,
            String specification
    ) {
    }
}
