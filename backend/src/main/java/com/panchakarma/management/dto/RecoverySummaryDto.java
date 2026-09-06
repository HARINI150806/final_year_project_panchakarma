package com.panchakarma.management.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RecoverySummaryDto {

    private Long therapyPlanId;
    private String therapyName;
    private Integer totalSessions;
    private Integer completedSessions;
    
    // Baseline Assessment (Session 0)
    private Integer baselinePain;
    private Integer baselineSleep;
    private Integer baselineEnergy;
    private Integer baselineOverall;

    // Current Assessment (Latest Session)
    private Integer currentPain;
    private Integer currentSleep;
    private Integer currentEnergy;
    private Integer currentOverall;

    // Recovery percentages
    private Double currentRecoveryPercentage;
    private Double predictedFinalRecovery;
    private String modelVersion;
    private String status; // "Improving", "Stable", "Needs Attention"

    private String therapistRemarks;
    private String clinicalObservation;

    private List<SessionAssessmentDto> sessionHistory;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class SessionAssessmentDto {
        private Integer sessionNumber;
        private Integer painLevel;
        private Integer sleepQuality;
        private Integer energyLevel;
        private Integer overallCondition;
        private Double currentRecoveryPercentage;
        private String assessmentDate;
        private String remarks;
    }
}
