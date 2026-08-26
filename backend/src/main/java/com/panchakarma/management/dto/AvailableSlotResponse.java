package com.panchakarma.management.dto;

import java.time.LocalDate;
import java.time.LocalTime;

public record AvailableSlotResponse(
    Long therapistId,
    String therapistName,
    LocalDate date,
    LocalTime startTime,
    LocalTime endTime,
    String meetLink
) {}
