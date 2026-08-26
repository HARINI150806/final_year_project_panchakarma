package com.panchakarma.management.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalTime;

public class FollowUpDto {

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ScheduleRequest {
        private Long patientId;
        private Long bookingId;
        private String treatmentName;
        private LocalDate followupDate;
        private String followupTime; // e.g. "10:30 AM" or "10:30"
        private String reason;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ObservationRequest {
        private Integer painLevel;
        private Integer sleepQuality;
        private Integer energyLevel;
        private String recoveryStatus;
        private String additionalObservations;
        private Boolean continueMedication;
        private Boolean furtherTherapyRequired;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Response {
        private Long followupId;
        private Long patientId;
        private String patientName;
        private String patientEmail;
        private Long therapistId;
        private String therapistName;
        private Long bookingId;
        private String treatmentName;
        private LocalDate followupDate;
        private String followupTime;
        private String reason;
        private String status;
        private Integer painLevel;
        private Integer sleepQuality;
        private Integer energyLevel;
        private String recoveryStatus;
        private String additionalObservations;
        private Boolean continueMedication;
        private Boolean furtherTherapyRequired;
        private String createdAt;
    }
}
