package com.panchakarma.management.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class DoshaAssessmentResponse {
    private String doshaType;
    private String dominantDosha;
    private Integer vataScore;
    private Integer pittaScore;
    private Integer kaphaScore;
    private boolean doshaAssessmentCompleted;
    private LocalDateTime doshaAssessmentDate;
    private List<String> recommendedTherapies = Collections.emptyList();
    private String message;

    public DoshaAssessmentResponse(String dominantDosha, String message) {
        this.doshaType = dominantDosha;
        this.dominantDosha = dominantDosha;
        this.message = message;
    }
}
