package com.panchakarma.management.service.impl;

import com.panchakarma.management.dto.ScheduleTreatmentPlanRequest;
import com.panchakarma.management.dto.TreatmentPlanDto;
import com.panchakarma.management.exception.ResourceNotFoundException;
import com.panchakarma.management.model.Booking;
import com.panchakarma.management.model.BookingStatus;
import com.panchakarma.management.model.BookingType;
import com.panchakarma.management.model.ConsultationType;
import com.panchakarma.management.model.TreatmentPlan;
import com.panchakarma.management.model.User;
import com.panchakarma.management.model.Patient;
import com.panchakarma.management.repository.PatientRepository;
import com.panchakarma.management.repository.BookingRepository;
import com.panchakarma.management.repository.TreatmentPlanRepository;
import com.panchakarma.management.repository.UserRepository;
import com.panchakarma.management.service.NotificationService;
import com.panchakarma.management.service.TreatmentPlanService;
import com.panchakarma.management.websocket.BookingWebSocketHandler;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class TreatmentPlanServiceImpl implements TreatmentPlanService {

    @Autowired
    private TreatmentPlanRepository treatmentPlanRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PatientRepository patientRepository;

    @Autowired
    private BookingRepository bookingRepository;

    @Autowired
    private NotificationService notificationService;

    @Autowired
    private BookingWebSocketHandler bookingWebSocketHandler;

    @Override
    @Transactional
    public TreatmentPlanDto createTreatmentPlan(TreatmentPlanDto dto) {
        User patient = userRepository.findById(dto.patientId())
                .orElseGet(() -> patientRepository.findById(dto.patientId())
                        .map(Patient::getUser)
                        .orElseThrow(() -> new ResourceNotFoundException("Patient not found with id: " + dto.patientId())));

        User doctor = null;
        if (dto.prescribedById() != null) {
            doctor = userRepository.findById(dto.prescribedById()).orElse(null);
        } else {
            try {
                org.springframework.security.core.Authentication auth = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
                if (auth != null && auth.isAuthenticated() && !auth.getName().equals("anonymousUser")) {
                    doctor = userRepository.findByEmail(auth.getName()).orElse(null);
                }
            } catch (Exception e) {
                // Ignore security context exceptions
            }
        }

        User therapist = dto.assignedTherapistId() != null
                ? userRepository.findById(dto.assignedTherapistId()).orElse(null)
                : null;

        if (doctor != null && doctor.getRole() == com.panchakarma.management.model.UserRole.THERAPIST) {
            therapist = doctor;
        }

        TreatmentPlan plan = new TreatmentPlan();
        plan.setPatient(patient);
        plan.setPrescribedBy(doctor);
        plan.setAssignedTherapist(therapist);
        plan.setTherapyName(dto.therapyName());
        plan.setTotalSessions(dto.totalSessions() != null ? dto.totalSessions() : 1);
        plan.setFrequency(dto.frequency() != null ? dto.frequency() : "ALTERNATE_DAYS");
        plan.setPrescribedStartDate(dto.prescribedStartDate() != null ? dto.prescribedStartDate() : LocalDate.now().plusDays(2));
        plan.setClinicalNotes(dto.clinicalNotes());
        plan.setStatus("PLANNED");
        plan.setPackageId("PLAN-" + System.currentTimeMillis());

        TreatmentPlan saved = treatmentPlanRepository.save(plan);

        // Notify patient that a plan has been prescribed by their doctor
        try {
            String doctorName = doctor != null ? doctor.getFullName() : "Your Ayurvedic Specialist";
            String msg = String.format("%s has prescribed a %d-session %s plan (%s). Please select your preferred time slot to start treatment.",
                    doctorName, saved.getTotalSessions(), saved.getTherapyName(), formatFrequency(saved.getFrequency()));
            notificationService.createNotification(patient, "New Treatment Plan Prescribed 🌿", msg, "/dashboard/patient?tab=treatment&planId=" + saved.getId());
        } catch (Exception e) {
            System.err.println("Failed to send treatment plan notification: " + e.getMessage());
        }

        return mapToDto(saved);
    }

    @Override
    public List<TreatmentPlanDto> getTreatmentPlansByPatientId(Long patientId) {
        return treatmentPlanRepository.findByPatient_Id(patientId).stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Override
    public List<TreatmentPlanDto> getMyPrescriptions(Long doctorId) {
        return treatmentPlanRepository.findByPrescribedBy_Id(doctorId).stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Override
    public List<TreatmentPlanDto> getAllTreatmentPlans() {
        return treatmentPlanRepository.findAll().stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public TreatmentPlanDto scheduleTreatmentPlan(Long planId, ScheduleTreatmentPlanRequest request) {
        TreatmentPlan plan = treatmentPlanRepository.findById(planId)
                .orElseThrow(() -> new ResourceNotFoundException("Treatment plan not found with id: " + planId));

        LocalDate startDate = (request != null && request.startDate() != null) ? request.startDate() : plan.getPrescribedStartDate();
        if (startDate == null) {
            startDate = LocalDate.now();
        }

        String rawTime = (request != null) ? request.timeSlot() : null;
        if (rawTime != null && rawTime.contains("-")) {
            rawTime = rawTime.split("-")[0].trim();
        }
        if (rawTime != null && rawTime.length() >= 5) {
            rawTime = rawTime.substring(0, 5);
        }
        LocalTime startTime = (rawTime != null && !rawTime.trim().isEmpty()) ? LocalTime.parse(rawTime) : LocalTime.of(9, 0);

        int totalSessions = plan.getTotalSessions() > 0 ? plan.getTotalSessions() : 1;
        int dayGap = getDayGapForFrequency(plan.getFrequency());

        for (int i = 0; i < totalSessions; i++) {
            int sessionNum = i + 1;
            LocalDate sessionDate = startDate.plusDays((long) i * dayGap);

            Booking booking = new Booking();
            booking.setPatient(plan.getPatient());
            booking.setPatientName(plan.getPatient() != null ? plan.getPatient().getFullName() : "Patient");
            booking.setPatientEmail(plan.getPatient() != null ? plan.getPatient().getEmail() : "");

            User therapistToAssign = plan.getAssignedTherapist();
            if (therapistToAssign == null) {
                therapistToAssign = pickLeastLoadedTherapist(sessionDate);
            }
            if (therapistToAssign != null) {
                booking.setAssignedTo(therapistToAssign);
                booking.setTherapistName(therapistToAssign.getFullName());
            }

            Long therapistId = therapistToAssign != null ? therapistToAssign.getId() : null;
            LocalTime resolvedTime = resolveAvailableTimeSlotForDate(therapistId, sessionDate, startTime);

            booking.setDate(sessionDate);
            booking.setTime(resolvedTime);
            booking.setBookingType(BookingType.THERAPY);
            booking.setBookingStatus(BookingStatus.CONFIRMED);
            booking.setConsultationType(ConsultationType.OFFLINE);
            booking.setTherapyName(plan.getTherapyName());
            booking.setPackageId(plan.getPackageId());
            booking.setSessionNumber(sessionNum);
            booking.setTotalSessions(totalSessions);

            String phaseName;
            switch (sessionNum) {
                case 1: phaseName = "Purvakarma — Initial Assessment & Oleation"; break;
                case 2: phaseName = "Oleation Phase — Shirodhara / Deep Tissue"; break;
                case 3: phaseName = "Pradhanakarma — Main Detox Session"; break;
                case 4: phaseName = "Paschatkarma — Recovery Assessment"; break;
                case 5: phaseName = "Rasayana — Rejuvenation Therapy"; break;
                default: phaseName = "Clinical Follow-Up Session"; break;
            }

            String purpose = String.format("%s (%s • Session %d of %d)",
                    plan.getTherapyName(), phaseName, sessionNum, totalSessions);
            booking.setPurpose(purpose);

            Booking savedBooking = bookingRepository.save(booking);

            Long assignedTherapistId = savedBooking.getAssignedTo() != null ? savedBooking.getAssignedTo().getId() : null;
            bookingWebSocketHandler.broadcastBookingUpdate(assignedTherapistId, savedBooking.getDate().toString());
        }

        plan.setStatus("SCHEDULED");
        TreatmentPlan updated = treatmentPlanRepository.save(plan);

        // Notify patient and doctor
        try {
            notificationService.createNotification(
                    plan.getPatient(),
                    "Treatment Plan Scheduled 🎉",
                    String.format("Your %d-session %s plan has been scheduled starting %s at %s.",
                            totalSessions, plan.getTherapyName(), startDate, startTime),
                    "/dashboard/patient?tab=treatment&planId=" + plan.getId()
            );
        } catch (Exception e) {
            System.err.println("Failed to send scheduling notification: " + e.getMessage());
        }

        return mapToDto(updated);
    }

    private int getDayGapForFrequency(String frequency) {
        if (frequency == null) return 2;
        switch (frequency.toUpperCase()) {
            case "ONCE_DAILY": return 1;
            case "ALTERNATE_DAYS": return 2;
            case "EVERY_3_DAYS": return 3;
            case "WEEKLY": return 7;
            default: return 2;
        }
    }

    private String formatFrequency(String frequency) {
        if (frequency == null) return "Alternate Days";
        switch (frequency.toUpperCase()) {
            case "ONCE_DAILY": return "Once Daily";
            case "ALTERNATE_DAYS": return "Alternate Days";
            case "EVERY_3_DAYS": return "Every 3 Days";
            case "WEEKLY": return "Weekly";
            default: return frequency;
        }
    }

    private TreatmentPlanDto mapToDto(TreatmentPlan plan) {
        return new TreatmentPlanDto(
                plan.getId(),
                plan.getPatient() != null ? plan.getPatient().getId() : null,
                plan.getPatient() != null ? plan.getPatient().getFullName() : null,
                plan.getPatient() != null ? plan.getPatient().getEmail() : null,
                plan.getPrescribedBy() != null ? plan.getPrescribedBy().getId() : null,
                plan.getPrescribedBy() != null ? plan.getPrescribedBy().getFullName() : null,
                plan.getAssignedTherapist() != null ? plan.getAssignedTherapist().getId() : null,
                plan.getAssignedTherapist() != null ? plan.getAssignedTherapist().getFullName() : null,
                plan.getTherapyName(),
                plan.getTotalSessions(),
                plan.getFrequency(),
                plan.getPrescribedStartDate(),
                plan.getClinicalNotes(),
                plan.getStatus(),
                plan.getPackageId(),
                plan.getCreatedAt()
        );
    }

    private LocalTime resolveAvailableTimeSlotForDate(Long therapistId, LocalDate date, LocalTime preferredTime) {
        if (therapistId == null || preferredTime == null) return preferredTime;

        boolean isPreferredTaken = bookingRepository.findByAssignedTo_Id(therapistId).stream()
                .anyMatch(b -> b.getDate() != null && b.getDate().equals(date) && b.getTime() != null && b.getTime().equals(preferredTime) && b.getBookingStatus() != BookingStatus.CANCELLED);

        if (!isPreferredTaken) {
            return preferredTime;
        }

        LocalTime[] standardSlots = new LocalTime[]{
            LocalTime.of(9, 0),
            LocalTime.of(10, 0),
            LocalTime.of(11, 0),
            LocalTime.of(12, 0),
            LocalTime.of(14, 0),
            LocalTime.of(15, 0),
            LocalTime.of(16, 0),
            LocalTime.of(17, 0)
        };

        Set<LocalTime> bookedTimes = bookingRepository.findByAssignedTo_Id(therapistId).stream()
                .filter(b -> b.getDate() != null && b.getDate().equals(date) && b.getTime() != null && b.getBookingStatus() != BookingStatus.CANCELLED)
                .map(Booking::getTime)
                .collect(Collectors.toSet());

        for (LocalTime slot : standardSlots) {
            if (slot.isAfter(preferredTime) && !bookedTimes.contains(slot)) {
                return slot;
            }
        }

        for (LocalTime slot : standardSlots) {
            if (!bookedTimes.contains(slot)) {
                return slot;
            }
        }

        return preferredTime;
    }

    private User pickLeastLoadedTherapist(LocalDate targetDate) {
        List<User> therapists = userRepository.findByRole(com.panchakarma.management.model.UserRole.THERAPIST);
        if (therapists == null || therapists.isEmpty()) {
            therapists = userRepository.findAll().stream()
                .filter(u -> u.getRole() == com.panchakarma.management.model.UserRole.THERAPIST)
                .collect(Collectors.toList());
        }
        if (therapists == null || therapists.isEmpty()) return null;

        java.util.Comparator<User> comparator = java.util.Comparator
            .comparingLong((User t) -> bookingRepository.countByAssignedToAndDate(t, targetDate))
            .thenComparingLong(t -> bookingRepository.countByAssignedTo(t))
            .thenComparingLong(User::getId);

        return therapists.stream()
            .min(comparator)
            .orElse(null);
    }
}
