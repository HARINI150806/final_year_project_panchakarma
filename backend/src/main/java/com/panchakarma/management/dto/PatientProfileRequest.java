package com.panchakarma.management.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PatientProfileRequest {

    private LocalDate dateOfBirth;
    private String gender;
    private Double height;
    private Double weight;
    private String occupation;
    private String otherOccupation;
    private List<String> existingHealthConditions;
    private String otherHealthCondition;
    private List<String> allergies;
    private String otherAllergy;
    private String medicineAllergySpecification;
    private List<String> previousTreatments;
    private String otherPreviousTreatment;
}