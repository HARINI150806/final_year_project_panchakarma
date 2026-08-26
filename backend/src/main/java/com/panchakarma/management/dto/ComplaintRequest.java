package com.panchakarma.management.dto;

import com.panchakarma.management.model.enums.*;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.List;

@Data
public class ComplaintRequest {
    private MainComplaint mainComplaint;
    private String otherComplaint;
    private BodyArea bodyArea;
    private String otherBodyArea;
    private Severity severity;
    private Integer durationValue;
    private DurationUnit durationUnit;
    @NotNull(message = "Frequency cannot be null")
    private Frequency frequency;
    private Integer painLevel;
    private String additionalDetails;
    private List<SymptomRequest> symptoms;

    @Data
    public static class SymptomRequest {
        private Symptom symptomName;
        private String otherSymptomDetails;
    }
}