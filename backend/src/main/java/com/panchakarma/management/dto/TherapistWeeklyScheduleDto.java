package com.panchakarma.management.dto;

import java.time.DayOfWeek;
import java.time.LocalTime;

public record TherapistWeeklyScheduleDto(
    Long id,
    DayOfWeek dayOfWeek,
    LocalTime startTime,
    LocalTime endTime,
    Boolean isAvailable
) {}
