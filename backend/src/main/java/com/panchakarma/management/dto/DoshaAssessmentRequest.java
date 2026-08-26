package com.panchakarma.management.dto;

import com.fasterxml.jackson.annotation.JsonAnySetter;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.HashMap;
import java.util.Map;

@Data
@NoArgsConstructor
public class DoshaAssessmentRequest {
    private Map<String, String> assessmentData = new HashMap<>();

    @JsonAnySetter
    public void add(String key, Object value) {
        this.assessmentData.put(key, String.valueOf(value));
    }
}