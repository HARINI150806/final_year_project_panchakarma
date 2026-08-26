package com.panchakarma.management.dto;

import java.time.LocalDate;
import java.time.LocalTime;

public record TherapistDateOverrideDto(
    Long id,
    LocalDate overrideDate,
    LocalTime startTime,
    LocalTime endTime,
    Boolean isAvailable
) {}
