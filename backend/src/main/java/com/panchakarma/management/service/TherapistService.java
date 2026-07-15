package com.panchakarma.management.service;

import com.panchakarma.management.dto.BookingResponse;
import com.panchakarma.management.dto.PatientSummaryResponse;
import com.panchakarma.management.dto.TherapistAssignedBookingDto;
import com.panchakarma.management.model.User;

import java.util.List;

public interface TherapistService {
    List<TherapistAssignedBookingDto> getMyBookings();
    List<PatientSummaryResponse> getMyPatients();
    List<User> listTherapists();
    List<TherapistAssignedBookingDto> getAssignedBookingsForPatient(Long patientId);
}