package com.panchakarma.management.service;

import java.util.List;

import com.panchakarma.management.dto.BookingRequest;
import com.panchakarma.management.dto.BookingResponse;

public interface BookingService {
    BookingResponse createBooking(BookingRequest bookingRequest);

    List<BookingResponse> getAllBookings();

    BookingResponse getBookingById(Long id);

    BookingResponse updateBooking(Long id, BookingRequest bookingRequest);

    void deleteBooking(Long id);

    List<BookingResponse> getBookingsByPatientId(Long patientId);
}