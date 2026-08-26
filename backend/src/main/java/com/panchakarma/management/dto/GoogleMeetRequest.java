package com.panchakarma.management.dto;

import java.time.LocalDateTime;

public record GoogleMeetRequest(
    String summary,
    LocalDateTime startDateTime,
    LocalDateTime endDateTime,
    String patientEmail,
    String doctorEmail
) {}
