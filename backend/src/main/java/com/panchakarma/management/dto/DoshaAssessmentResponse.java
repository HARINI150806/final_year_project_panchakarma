package com.panchakarma.management.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class DoshaAssessmentResponse {
    private String doshaType;
    private String message;
}