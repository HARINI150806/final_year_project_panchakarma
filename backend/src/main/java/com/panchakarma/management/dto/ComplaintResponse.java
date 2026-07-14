package com.panchakarma.management.dto;

import com.panchakarma.management.model.enums.*;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
public class ComplaintResponse {
    private Long id;
    private MainComplaint mainComplaint;
    private String otherComplaint;
    private BodyArea bodyArea;
    private String otherBodyArea;
    private Severity severity;
    private Integer durationValue;
    private DurationUnit durationUnit;
    private Frequency frequency;
    private Integer painLevel;
    private String additionalDetails;
    private ComplaintStatus status;
    private LocalDateTime createdAt;
    private List<SymptomResponse> symptoms;

    @Data
    public static class SymptomResponse {
        private Symptom symptomName;
        private String otherSymptomDetails;
    }
}