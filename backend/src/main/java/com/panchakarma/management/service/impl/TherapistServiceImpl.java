package com.panchakarma.management.service.impl;

import com.panchakarma.management.dto.BookingResponse;
import com.panchakarma.management.dto.PatientSummaryResponse;
import com.panchakarma.management.dto.TherapistAssignedBookingDto;
import com.panchakarma.management.exception.ResourceNotFoundException;
import com.panchakarma.management.model.Patient;
import com.panchakarma.management.model.User;
import com.panchakarma.management.model.UserRole;
import com.panchakarma.management.repository.BookingRepository;
import com.panchakarma.management.repository.PatientRepository;
import com.panchakarma.management.repository.UserRepository;
import com.panchakarma.management.service.TherapistService;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.Period;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class TherapistServiceImpl implements TherapistService {

    private final BookingRepository bookingRepository;
    private final UserRepository userRepository;
    private final PatientRepository patientRepository;

    public TherapistServiceImpl(BookingRepository bookingRepository, UserRepository userRepository, PatientRepository patientRepository) {
        this.bookingRepository = bookingRepository;
        this.userRepository = userRepository;
        this.patientRepository = patientRepository;
    }

    
    public List<PatientSummaryResponse> getMyPatients() {
        // This is a simplified implementation. A more robust implementation would
        // involve a direct relationship between therapists and patients.
        User user = getCurrentUser();
        return bookingRepository.findByAssignedTo(user).stream()
                .map(booking -> booking.getPatient().getPatient())
                .distinct()
                .map(patient -> {
                    Integer age = null;
                    if (patient.getDateOfBirth() != null) {
                        age = Period.between(patient.getDateOfBirth(), LocalDate.now()).getYears();
                    }
                    return new PatientSummaryResponse(
                            patient.getId(),
                            patient.getFirstName() + " " + patient.getLastName(),
                            patient.getEmail(),
                            patient.getContactNumber(),
                            patient.getGender(),
                            age,
                            patient.getDominantDosha(),
                            patient.isDoshaAssessmentCompleted(),
                            null // createdAt not directly available in Patient
                    );
                })
                .collect(Collectors.toList());
    }

    private User getCurrentUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));
    }

    @Override
    public List<TherapistAssignedBookingDto> getMyBookings() {
        User currentUser = getCurrentUser();
        return bookingRepository.findByAssignedTo(currentUser).stream()
                .map(booking -> new TherapistAssignedBookingDto(
                        booking.getBookingId(),
                        booking.getPatient().getFullName(),
                        booking.getBookingType().toString(), // therapyName
                        booking.getPurpose(), // therapyDescription
                        "", // therapyDuration - not available in Booking entity
                        booking.getDate(), // bookingDate
                        booking.getTime(), // bookingTime
                        booking.getBookingStatus().toString()
                ))
                .collect(Collectors.toList());
    }

    @Override
    public List<User> listTherapists() {
        return userRepository.findByRole(UserRole.THERAPIST);
    }

    @Override
    public List<TherapistAssignedBookingDto> getAssignedBookingsForPatient(Long patientId) {
        User currentUser = getCurrentUser();
        Patient patient = patientRepository.findById(patientId)
                .orElseThrow(() -> new ResourceNotFoundException("Patient not found with id: " + patientId));
        User patientUser = patient.getUser(); // Get the User entity associated with the Patient

        return bookingRepository.findByAssignedToAndPatient(currentUser, patientUser).stream()
                .map(booking -> new TherapistAssignedBookingDto(
                        booking.getBookingId(),
                        booking.getPatient().getFullName(),
                        booking.getBookingType().toString(), // therapyName
                        booking.getPurpose(), // therapyDescription
                        "", // therapyDuration - not available in Booking entity
                        booking.getDate(), // bookingDate
                        booking.getTime(), // bookingTime
                        booking.getBookingStatus().toString()
                ))
                .collect(Collectors.toList());
    }
}