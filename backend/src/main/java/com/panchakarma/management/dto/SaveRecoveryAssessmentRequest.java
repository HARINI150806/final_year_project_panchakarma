package com.panchakarma.management.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SaveRecoveryAssessmentRequest {

    private Long therapyPlanId;
    private Long patientId;
    private Integer sessionNumber; // 0 = Baseline, 1..N = Session
    private Integer painLevel;     // 0 - 10
    private Integer sleepQuality;  // 0 - 10
    private Integer energyLevel;   // 0 - 10
    private Integer overallCondition; // 0 - 10
    private String clinicalObservation;
    private String therapistRemarks;
}
