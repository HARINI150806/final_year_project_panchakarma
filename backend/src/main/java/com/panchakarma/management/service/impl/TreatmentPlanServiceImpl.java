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
    private com.panchakarma.management.service.AvailabilityService availabilityService;

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
        String resolvedTherapyName = (dto.therapyName() != null && !dto.therapyName().trim().isEmpty() && !dto.therapyName().equalsIgnoreCase("CONSULTATION"))
                ? dto.therapyName()
                : "Abhyanga";
        plan.setTherapyName(resolvedTherapyName);
        plan.setTotalSessions(dto.totalSessions() != null ? dto.totalSessions() : 1);
        plan.setFrequency(dto.frequency() != null ? dto.frequency() : "ALTERNATE_DAYS");
        plan.setPrescribedStartDate(dto.prescribedStartDate() != null ? dto.prescribedStartDate() : LocalDate.now().plusDays(2));
        plan.setClinicalNotes(dto.clinicalNotes());
        plan.setStatus("PLANNED");
        plan.setPackageId("PLAN-" + System.currentTimeMillis());

        Long consultId = dto.consultationBookingId();
        if (consultId == null && patient != null) {
            List<Booking> patientBookings = bookingRepository.findByPatient_Id(patient.getId());
            consultId = patientBookings.stream()
                    .filter(b -> b.getBookingType() == BookingType.CONSULTATION || (b.getPurpose() != null && b.getPurpose().toLowerCase().contains("consultation")))
                    .sorted(java.util.Comparator.comparing(Booking::getBookingId, java.util.Comparator.nullsLast(java.util.Comparator.reverseOrder())))
                    .map(Booking::getBookingId)
                    .findFirst().orElse(null);
        }
        plan.setConsultationBookingId(consultId);

        TreatmentPlan saved = treatmentPlanRepository.save(plan);

        // Notify patient that a plan has been prescribed by their doctor
        if (patient != null) {
            String doctorName = doctor != null ? doctor.getFullName() : "Doctor";
            try {
                notificationService.createNotification(
                        patient,
                        "New Treatment Plan Prescribed",
                        String.format("%s prescribed a %d-session %s plan.", doctorName, saved.getTotalSessions(), saved.getTherapyName()),
                        "/dashboard/patient?tab=treatment-journey"
                );
            } catch (Exception ignored) {}
        }

        return mapToDto(saved);
    }

    @Override
    public List<TreatmentPlanDto> getTreatmentPlansByPatientId(Long patientId) {
        List<TreatmentPlan> plans = treatmentPlanRepository.findByPatient_Id(patientId);
        return plans.stream().map(this::mapToDto).collect(Collectors.toList());
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

        String effectiveTherapyName = (plan.getTherapyName() != null && !plan.getTherapyName().trim().isEmpty() && !plan.getTherapyName().equalsIgnoreCase("CONSULTATION"))
                ? plan.getTherapyName()
                : "Abhyanga Therapy";

        if (plan.getConsultationBookingId() == null && plan.getPatient() != null) {
            List<Booking> patientBookings = bookingRepository.findByPatient_Id(plan.getPatient().getId());
            Long consultId = patientBookings.stream()
                    .filter(b -> b.getBookingType() == BookingType.CONSULTATION || (b.getPurpose() != null && b.getPurpose().toLowerCase().contains("consultation")))
                    .sorted(java.util.Comparator.comparing(Booking::getBookingId, java.util.Comparator.nullsLast(java.util.Comparator.reverseOrder())))
                    .map(Booking::getBookingId)
                    .findFirst().orElse(null);
            plan.setConsultationBookingId(consultId);
        }

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
            booking.setConsultationType(null);
            booking.setTherapyName(effectiveTherapyName);
            booking.setPackageId(plan.getPackageId());
            booking.setConsultationBookingId(plan.getConsultationBookingId());
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
                    effectiveTherapyName, phaseName, sessionNum, totalSessions);
            booking.setPurpose(purpose);

            Booking savedBooking = bookingRepository.save(booking);

            if (bookingWebSocketHandler != null && savedBooking.getDate() != null) {
                Long assignedTherapistId = savedBooking.getAssignedTo() != null ? savedBooking.getAssignedTo().getId() : null;
                try {
                    bookingWebSocketHandler.broadcastBookingUpdate(assignedTherapistId, savedBooking.getDate().toString());
                } catch (Exception ignored) {}
            }
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
                plan.getConsultationBookingId(),
                plan.getCreatedAt()
        );
    }

    private LocalTime resolveAvailableTimeSlotForDate(Long therapistId, LocalDate date, LocalTime preferredTime) {
        if (therapistId == null || date == null) return preferredTime != null ? preferredTime : LocalTime.of(9, 0);

        User therapist = userRepository.findById(therapistId).orElse(null);
        List<LocalTime[]> workingSlots;
        if (therapist != null) {
            workingSlots = availabilityService.getTherapistWorkingSlotsForDate(therapist, date);
        } else {
            workingSlots = java.util.Collections.emptyList();
        }

        if (workingSlots.isEmpty()) {
            workingSlots = java.util.Arrays.asList(
                new LocalTime[]{LocalTime.of(9, 0), LocalTime.of(9, 45)},
                new LocalTime[]{LocalTime.of(9, 45), LocalTime.of(10, 30)},
                new LocalTime[]{LocalTime.of(10, 30), LocalTime.of(11, 15)},
                new LocalTime[]{LocalTime.of(11, 15), LocalTime.of(12, 0)},
                new LocalTime[]{LocalTime.of(12, 0), LocalTime.of(12, 45)},
                new LocalTime[]{LocalTime.of(13, 30), LocalTime.of(14, 15)},
                new LocalTime[]{LocalTime.of(14, 15), LocalTime.of(15, 0)},
                new LocalTime[]{LocalTime.of(15, 0), LocalTime.of(15, 45)},
                new LocalTime[]{LocalTime.of(15, 45), LocalTime.of(16, 30)}
            );
        }

        List<Booking> activeBookings = bookingRepository.findByAssignedTo_Id(therapistId).stream()
                .filter(b -> b.getDate() != null && b.getDate().equals(date) && b.getTime() != null && b.getBookingStatus() != BookingStatus.CANCELLED)
                .collect(Collectors.toList());

        if (preferredTime != null) {
            boolean isPreferredOverlapped = activeBookings.stream().anyMatch(b -> {
                LocalTime bStart = b.getTime();
                LocalTime bEnd = bStart.plusMinutes(45);
                LocalTime prefEnd = preferredTime.plusMinutes(45);
                return preferredTime.isBefore(bEnd) && prefEnd.isAfter(bStart);
            });

            if (!isPreferredOverlapped) {
                return preferredTime;
            }
        }

        for (LocalTime[] slotRange : workingSlots) {
            LocalTime slotStart = slotRange[0];

            boolean overlaps = activeBookings.stream().anyMatch(b -> {
                LocalTime bStart = b.getTime();
                LocalTime bEnd = bStart.plusMinutes(45);
                LocalTime slotEnd = slotStart.plusMinutes(45);
                return slotStart.isBefore(bEnd) && slotEnd.isAfter(bStart);
            });

            if (!overlaps && (preferredTime == null || slotStart.isAfter(preferredTime) || slotStart.equals(preferredTime))) {
                return slotStart;
            }
        }

        for (LocalTime[] slotRange : workingSlots) {
            LocalTime slotStart = slotRange[0];

            boolean overlaps = activeBookings.stream().anyMatch(b -> {
                LocalTime bStart = b.getTime();
                LocalTime bEnd = bStart.plusMinutes(45);
                LocalTime slotEnd = slotStart.plusMinutes(45);
                return slotStart.isBefore(bEnd) && slotEnd.isAfter(bStart);
            });

            if (!overlaps) {
                return slotStart;
            }
        }

        return preferredTime != null ? preferredTime : LocalTime.of(9, 0);
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
