package com.panchakarma.management.dto;

import com.panchakarma.management.model.BookingStatus;
import com.panchakarma.management.model.BookingType;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class BookingRequest {
    private Long patientId;
    private LocalDate date;
    private LocalTime time;
    private String purpose;
    private BookingType bookingType;
    private BookingStatus bookingStatus;
    private Long assignedToId;
}