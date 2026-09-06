package com.panchakarma.management.service;

import com.panchakarma.management.dto.RecoverySummaryDto;
import com.panchakarma.management.dto.SaveRecoveryAssessmentRequest;

public interface RecoveryTrackingService {

    RecoverySummaryDto saveAssessment(SaveRecoveryAssessmentRequest request, String therapistEmail);

    RecoverySummaryDto getRecoverySummaryForPlan(Long therapyPlanId);

    RecoverySummaryDto getLatestRecoverySummaryForPatient(Long patientId);
}
