package com.panchakarma.management.service;

import com.panchakarma.management.dto.ScheduleTreatmentPlanRequest;
import com.panchakarma.management.dto.TreatmentPlanDto;

import java.util.List;

public interface TreatmentPlanService {
    TreatmentPlanDto createTreatmentPlan(TreatmentPlanDto dto);
    List<TreatmentPlanDto> getTreatmentPlansByPatientId(Long patientId);
    List<TreatmentPlanDto> getMyPrescriptions(Long doctorId);
    List<TreatmentPlanDto> getAllTreatmentPlans();
    TreatmentPlanDto scheduleTreatmentPlan(Long planId, ScheduleTreatmentPlanRequest request);
}
