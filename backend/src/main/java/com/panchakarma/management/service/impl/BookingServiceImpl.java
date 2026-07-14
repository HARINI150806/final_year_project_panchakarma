package com.panchakarma.management.service.impl;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.panchakarma.management.dto.BookingRequest;
import com.panchakarma.management.dto.BookingResponse;
import com.panchakarma.management.exception.ResourceNotFoundException;
import com.panchakarma.management.model.Booking;
import com.panchakarma.management.model.Booking;
import com.panchakarma.management.model.Patient;
import com.panchakarma.management.model.User;
import com.panchakarma.management.repository.BookingRepository;
import com.panchakarma.management.repository.PatientRepository;
import com.panchakarma.management.repository.UserRepository;
import com.panchakarma.management.service.BookingService;

@Service
public class BookingServiceImpl implements BookingService {

    @Autowired
    private BookingRepository bookingRepository;

    @Autowired
    private PatientRepository patientRepository;

    @Autowired
    private UserRepository userRepository;

    @Override
    public BookingResponse createBooking(BookingRequest bookingRequest) {
        User patient = userRepository.findById(bookingRequest.getPatientId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Patient not found with id: " + bookingRequest.getPatientId()));

        Booking booking = new Booking();
        booking.setPatient(patient);
        booking.setPatientName(patient.getFullName());
        booking.setPatientEmail(patient.getEmail());

        if (bookingRequest.getAssignedToId() != null) {
            User assignedTo = userRepository.findById(bookingRequest.getAssignedToId())
                    .orElseThrow(() -> new ResourceNotFoundException("Therapist not found with id: " + bookingRequest.getAssignedToId()));
            booking.setAssignedTo(assignedTo);
            booking.setTherapistName(assignedTo.getFullName());
        }

        booking.setDate(bookingRequest.getDate());
        booking.setTime(bookingRequest.getTime());
        booking.setPurpose(bookingRequest.getPurpose());
        booking.setBookingType(bookingRequest.getBookingType());
        booking.setBookingStatus(bookingRequest.getBookingStatus());

        Booking savedBooking = bookingRepository.save(booking);
        return mapToBookingResponse(savedBooking);
    }

    @Override
    public List<BookingResponse> getAllBookings() {
        return bookingRepository.findAll().stream()
                .map(this::mapToBookingResponse)
                .collect(Collectors.toList());
    }

    @Override
    public BookingResponse getBookingById(Long id) {
        Booking booking = bookingRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Booking not found with id: " + id));
        return mapToBookingResponse(booking);
    }

    @Override
    public BookingResponse updateBooking(Long id, BookingRequest bookingRequest) {
        Booking booking = bookingRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Booking not found with id: " + id));

        User patient = userRepository.findById(bookingRequest.getPatientId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Patient not found with id: " + bookingRequest.getPatientId()));

        booking.setPatient(patient);

        if (bookingRequest.getAssignedToId() != null) {
            User assignedTo = userRepository.findById(bookingRequest.getAssignedToId())
                    .orElseThrow(() -> new ResourceNotFoundException("Therapist not found with id: " + bookingRequest.getAssignedToId()));
            booking.setAssignedTo(assignedTo);
        } else {
            booking.setAssignedTo(null); // Clear assigned therapist if not provided
        }

        booking.setDate(bookingRequest.getDate());
        booking.setTime(bookingRequest.getTime());
        booking.setPurpose(bookingRequest.getPurpose());
        booking.setBookingType(bookingRequest.getBookingType());
        booking.setBookingStatus(bookingRequest.getBookingStatus());

        Booking updatedBooking = bookingRepository.save(booking);
        return mapToBookingResponse(updatedBooking);
    }

    @Override
    public void deleteBooking(Long id) {
        if (!bookingRepository.existsById(id)) {
            throw new ResourceNotFoundException("Booking not found with id: " + id);
        }
        bookingRepository.deleteById(id);
    }

    private BookingResponse mapToBookingResponse(Booking booking) {
        BookingResponse.TherapistSummaryResponse assignedTo = null;
        if (booking.getAssignedTo() != null) {
            assignedTo = new BookingResponse.TherapistSummaryResponse(
                    booking.getAssignedTo().getId(),
                    booking.getAssignedTo().getFullName()
            );
        }
        return new BookingResponse(
                booking.getBookingId(),
                booking.getBookingType(),
                booking.getDate(),
                booking.getTime(),
                booking.getPurpose(),
                booking.getBookingStatus(),
                assignedTo
        );
    }

    @Override
    public List<BookingResponse> getBookingsByPatientId(Long patientId) {
        return bookingRepository.findByPatient_Id(patientId).stream()
                .map(this::mapToBookingResponse)
                .collect(Collectors.toList());
    }
}