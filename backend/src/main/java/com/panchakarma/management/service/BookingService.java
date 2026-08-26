package com.panchakarma.management.service;

import java.util.List;

import com.panchakarma.management.dto.BookingRequest;
import com.panchakarma.management.dto.BookingResponse;
import com.panchakarma.management.dto.AutoBookingRequest;
import com.panchakarma.management.dto.AutoBookingResponse;

public interface BookingService {
    BookingResponse createBooking(BookingRequest bookingRequest);

    List<BookingResponse> getAllBookings();

    BookingResponse getBookingById(Long id);

    BookingResponse updateBooking(Long id, BookingRequest bookingRequest);

    void deleteBooking(Long id);

    List<BookingResponse> getBookingsByPatientId(Long patientId);

    AutoBookingResponse autoScheduleConsultation(AutoBookingRequest request);

    BookingResponse updateSessionDetails(Long id, String sessionNotes, String patientAdvice, String status);
    
    BookingResponse requestReschedule(Long id, java.time.LocalDate proposedDate, java.time.LocalTime proposedTime, String reason);
    
    BookingResponse respondReschedule(Long id, boolean approved, String declineReason,
            java.time.LocalDate altSlot1Date, java.time.LocalTime altSlot1Time,
            java.time.LocalDate altSlot2Date, java.time.LocalTime altSlot2Time,
            java.time.LocalDate altSlot3Date, java.time.LocalTime altSlot3Time);
    
    BookingResponse acceptAlternativeSlot(Long id, int slotNumber);
    
    BookingResponse cancelBooking(Long id);
}