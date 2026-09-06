package com.panchakarma.management.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TreatmentJourneyResponse {
    private boolean hasActiveJourney;
    private boolean isLastJourney;
    private List<TreatmentCycleDto> cycles;
    private List<TreatmentJourneyNodeDto> nodes; // Nodes of active cycle
    private int activeCycleNumber;
    private int completedNodesCount;
    private int totalNodesCount;
    private int progressPercent;
    private String currentActiveStageTitle;
    private String patientName;
    private String dominantDosha;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TreatmentCycleDto {
        private int cycleNumber;
        private String cycleName;
        private String displayTitle; // e.g. "Knee Pain — Abhyanga (10 Aug 2026)"
        private String chiefComplaint;
        private String therapyName;
        private boolean hasFollowup;
        private boolean isCurrentCycle;
        private List<TreatmentJourneyNodeDto> nodes;
        private int progressPercent;
    }
}
