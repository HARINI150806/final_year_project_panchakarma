package com.panchakarma.management.service;

import com.panchakarma.management.dto.TreatmentJourneyResponse;

public interface TreatmentJourneyService {
    TreatmentJourneyResponse getJourneyForPatient(Long patientId);
    TreatmentJourneyResponse getJourneyForPatientUsername(String username);
}
