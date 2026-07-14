package com.panchakarma.management.service;

import com.panchakarma.management.dto.DoshaAssessmentResponse;
import com.panchakarma.management.dto.PatientProfileResponse;
import com.panchakarma.management.dto.DoshaAssessmentRequest;
import com.panchakarma.management.model.Patient;
import java.util.List;

public interface PatientService {
    Patient createPatient(Patient patient);
    List<Patient> getAllPatients();
    Patient getPatientById(Long id);
    Patient updatePatient(Long id, Patient patient);
    void deletePatient(Long id);
    DoshaAssessmentResponse performDoshaAssessment(Long patientId, DoshaAssessmentRequest request);
    PatientProfileResponse getPatientProfile(Long userId);
}