package com.panchakarma.management.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TreatmentJourneyNodeDto {
    private String id;
    private String type; // CONSULTATION, THERAPY_PLAN, THERAPY_PROGRESS, FOLLOWUP, RECOVERY
    private String title;
    private String description;
    private String date;
    private String time;
    private String status; // COMPLETED, ACTIVE, PENDING, CANCELLED
    private String assignedTherapist;
    
    // Clinical & Complaint fields
    private String chiefComplaint;
    private String diagnosis;

    // Therapy Plan & Progress fields
    private String therapyName;
    private String planCreatedDate;
    private String firstSessionDate;
    private Integer totalSessions;
    private Integer completedSessions;
    private Integer remainingSessions;
    private String latestCompletedSessionDate;
    private String latestCompletedSessionTime;
    private String nextScheduledSessionDate;
    private String nextScheduledSessionTime;

    // Follow-up & Recovery fields
    private Boolean hasFollowup;
    private Double currentRecoveryPercent;
    private Double predictedRecoveryPercent;
    private String recoveryStatus;
    private String recoveryPlanNotes;
    private String therapistRemarks;

    // Control flags
    private Boolean isCurrentActive;
    private Integer eventOrder;
    private Integer cycleNumber;
    private String actionText;
    private String actionTab;
    private String actionUrl;
}
