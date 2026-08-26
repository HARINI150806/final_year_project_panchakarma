package com.panchakarma.management.service;

import com.panchakarma.management.dto.PatientProfileRequest;

public interface PatientProfileService {
    void updatePatientProfile(Long patientId, PatientProfileRequest patientProfileRequest);
    void updateMyPatientProfile(PatientProfileRequest patientProfileRequest);
}