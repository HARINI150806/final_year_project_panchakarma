package com.panchakarma.management.dto;

import com.panchakarma.management.model.Prescription;
import java.util.List;

public record PatientClinicalDetailsResponse(
    Long patientId,
    String fullName,
    String email,
    String phone,
    String gender,
    Integer age,
    Double height,
    Double weight,
    String occupation,
    String dominantDosha,
    Integer vataScore,
    Integer pittaScore,
    Integer kaphaScore,
    boolean doshaAssessmentCompleted,
    String chiefComplaint,
    String bodyArea,
    String severity,
    String duration,
    List<Prescription> pastPrescriptions
) {}
