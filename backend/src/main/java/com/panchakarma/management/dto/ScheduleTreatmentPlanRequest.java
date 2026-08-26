package com.panchakarma.management.dto;

import java.time.LocalDate;

public record ScheduleTreatmentPlanRequest(
    LocalDate startDate,
    String timeSlot
) {}
