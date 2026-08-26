package com.panchakarma.management.service;

import com.panchakarma.management.dto.FollowUpDto;
import com.panchakarma.management.model.Booking;
import com.panchakarma.management.model.FollowUp;
import com.panchakarma.management.model.User;
import com.panchakarma.management.repository.BookingRepository;
import com.panchakarma.management.repository.FollowUpRepository;
import com.panchakarma.management.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class FollowUpService {

    private final FollowUpRepository followUpRepository;
    private final UserRepository userRepository;
    private final BookingRepository bookingRepository;
    private final EmailService emailService;

    public FollowUpService(FollowUpRepository followUpRepository,
                           UserRepository userRepository,
                           BookingRepository bookingRepository,
                           EmailService emailService) {
        this.followUpRepository = followUpRepository;
        this.userRepository = userRepository;
        this.bookingRepository = bookingRepository;
        this.emailService = emailService;
    }

    @Transactional
    public FollowUpDto.Response scheduleFollowUp(FollowUpDto.ScheduleRequest request, String therapistEmail) {
        User therapist = userRepository.findByEmail(therapistEmail)
                .orElseThrow(() -> new IllegalArgumentException("Therapist not found"));

        User patient = userRepository.findById(request.getPatientId())
                .orElseThrow(() -> new IllegalArgumentException("Patient not found"));

        Booking booking = null;
        if (request.getBookingId() != null) {
            booking = bookingRepository.findById(request.getBookingId()).orElse(null);
        }

        LocalTime time = parseTime(request.getFollowupTime());
        String treatmentName = request.getTreatmentName();
        if ((treatmentName == null || treatmentName.isBlank()) && booking != null) {
            treatmentName = booking.getTherapyName() != null ? booking.getTherapyName() : booking.getPurpose();
        }
        if (treatmentName == null || treatmentName.isBlank()) {
            treatmentName = "Panchakarma Treatment";
        }

        FollowUp followUp = new FollowUp();
        followUp.setPatient(patient);
        followUp.setTherapist(therapist);
        followUp.setBooking(booking);
        followUp.setTreatmentName(treatmentName);
        followUp.setFollowupDate(request.getFollowupDate());
        followUp.setFollowupTime(time);
        followUp.setReason(request.getReason() != null && !request.getReason().isBlank() ? request.getReason() : "Routine Recovery Check");
        followUp.setStatus("UPCOMING");
        followUp.setReminderSent(false);

        FollowUp saved = followUpRepository.save(followUp);

        // Format details for email
        String dateStr = saved.getFollowupDate().format(DateTimeFormatter.ofPattern("dd MMMM yyyy"));
        String timeStr = formatTimeForDisplay(saved.getFollowupTime());

        // Send confirmation email to patient
        emailService.sendFollowUpConfirmationEmail(
                patient.getEmail(),
                patient.getFullName(),
                dateStr,
                timeStr,
                saved.getReason(),
                therapist.getFullName()
        );

        return mapToDto(saved);
    }

    public List<FollowUpDto.Response> getFollowUpsForPatient(String patientEmail) {
        User patient = userRepository.findByEmail(patientEmail)
                .orElseThrow(() -> new IllegalArgumentException("Patient not found"));
        return followUpRepository.findByPatientIdOrderByFollowupDateAsc(patient.getId())
                .stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    public List<FollowUpDto.Response> getFollowUpsForPatientId(Long patientId) {
        return followUpRepository.findByPatientIdOrderByFollowupDateAsc(patientId)
                .stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    public List<FollowUpDto.Response> getFollowUpsForTherapist(String therapistEmail) {
        User therapist = userRepository.findByEmail(therapistEmail)
                .orElseThrow(() -> new IllegalArgumentException("Therapist not found"));
        return followUpRepository.findByTherapistIdOrderByFollowupDateAsc(therapist.getId())
                .stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public FollowUpDto.Response recordObservation(Long followupId, FollowUpDto.ObservationRequest request) {
        FollowUp followUp = followUpRepository.findById(followupId)
                .orElseThrow(() -> new IllegalArgumentException("Follow-up not found"));

        followUp.setPainLevel(request.getPainLevel());
        followUp.setSleepQuality(request.getSleepQuality());
        followUp.setEnergyLevel(request.getEnergyLevel());
        followUp.setRecoveryStatus(request.getRecoveryStatus());
        followUp.setAdditionalObservations(request.getAdditionalObservations());
        followUp.setContinueMedication(request.getContinueMedication());
        followUp.setFurtherTherapyRequired(request.getFurtherTherapyRequired());
        followUp.setStatus("COMPLETED");

        FollowUp saved = followUpRepository.save(followUp);
        return mapToDto(saved);
    }

    @Transactional
    public void sendFollowUpRemindersForTomorrow() {
        LocalDate tomorrow = LocalDate.now().plusDays(1);
        List<FollowUp> upcomingFollowups = followUpRepository.findByFollowupDateAndReminderSentFalse(tomorrow);

        for (FollowUp followUp : upcomingFollowups) {
            try {
                String dateStr = followUp.getFollowupDate().format(DateTimeFormatter.ofPattern("dd MMMM yyyy"));
                String timeStr = formatTimeForDisplay(followUp.getFollowupTime());
                emailService.sendFollowUpReminderEmail(
                        followUp.getPatient().getEmail(),
                        followUp.getPatient().getFullName(),
                        dateStr,
                        timeStr,
                        followUp.getReason()
                );
                followUp.setReminderSent(true);
                followUpRepository.save(followUp);
            } catch (Exception e) {
                // Log and continue loop
            }
        }
    }

    private LocalTime parseTime(String timeStr) {
        if (timeStr == null || timeStr.isBlank()) {
            return LocalTime.of(10, 30);
        }
        try {
            return LocalTime.parse(timeStr);
        } catch (Exception e) {
            try {
                return LocalTime.parse(timeStr, DateTimeFormatter.ofPattern("hh:mm a"));
            } catch (Exception ex) {
                return LocalTime.of(10, 30);
            }
        }
    }

    private String formatTimeForDisplay(LocalTime time) {
        if (time == null) return "10:30 AM";
        return time.format(DateTimeFormatter.ofPattern("hh:mm a"));
    }

    private FollowUpDto.Response mapToDto(FollowUp followUp) {
        FollowUpDto.Response dto = new FollowUpDto.Response();
        dto.setFollowupId(followUp.getFollowupId());
        dto.setPatientId(followUp.getPatient() != null ? followUp.getPatient().getId() : null);
        dto.setPatientName(followUp.getPatient() != null ? followUp.getPatient().getFullName() : null);
        dto.setPatientEmail(followUp.getPatient() != null ? followUp.getPatient().getEmail() : null);
        dto.setTherapistId(followUp.getTherapist() != null ? followUp.getTherapist().getId() : null);
        dto.setTherapistName(followUp.getTherapist() != null ? followUp.getTherapist().getFullName() : null);
        dto.setBookingId(followUp.getBooking() != null ? followUp.getBooking().getBookingId() : null);
        dto.setTreatmentName(followUp.getTreatmentName());
        dto.setFollowupDate(followUp.getFollowupDate());
        dto.setFollowupTime(formatTimeForDisplay(followUp.getFollowupTime()));
        dto.setReason(followUp.getReason());
        dto.setStatus(followUp.getStatus());
        dto.setPainLevel(followUp.getPainLevel());
        dto.setSleepQuality(followUp.getSleepQuality());
        dto.setEnergyLevel(followUp.getEnergyLevel());
        dto.setRecoveryStatus(followUp.getRecoveryStatus());
        dto.setAdditionalObservations(followUp.getAdditionalObservations());
        dto.setContinueMedication(followUp.getContinueMedication());
        dto.setFurtherTherapyRequired(followUp.getFurtherTherapyRequired());
        dto.setCreatedAt(followUp.getCreatedAt() != null ? followUp.getCreatedAt().toString() : null);
        return dto;
    }
}
