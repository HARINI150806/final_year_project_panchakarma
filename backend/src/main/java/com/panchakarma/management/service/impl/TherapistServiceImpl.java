package com.panchakarma.management.service.impl;

import com.panchakarma.management.dto.BookingResponse;
import com.panchakarma.management.dto.PatientSummaryResponse;
import com.panchakarma.management.dto.TherapistAssignedBookingDto;
import com.panchakarma.management.model.User;
import com.panchakarma.management.model.UserRole;
import com.panchakarma.management.repository.BookingRepository;
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

    public TherapistServiceImpl(BookingRepository bookingRepository, UserRepository userRepository) {
        this.bookingRepository = bookingRepository;
        this.userRepository = userRepository;
    }

    @Override
    public List<TherapistAssignedBookingDto> getMyBookings() {
        User user = getCurrentUser();
        return bookingRepository.findByAssignedTo(user).stream()
                .map(booking -> new TherapistAssignedBookingDto(
                        booking.getBookingId(),
                        booking.getPatient().getFullName(),
                        booking.getPurpose(), // Assuming 'purpose' is the therapy name/description
                        booking.getDate(), // Assuming 'date' is the booking date
                        booking.getBookingStatus().toString()
                ))
                .collect(Collectors.toList());
    }

    @Override
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
                            null, // dominantDosha not directly available in Patient
                            patient.isProfileCompleted(),
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
    public List<User> listTherapists() {
        return userRepository.findByRole(UserRole.THERAPIST);
    }
}