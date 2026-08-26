package com.panchakarma.management.dto;

/** Request from patient to trigger an AI therapy suggestion */
public record AiSuggestRequest(
        Long complaintId   // Optional: use latest complaint if null
) {}
