package com.panchakarma.management.service.impl;

import com.panchakarma.management.dto.BookingResponse;
import com.panchakarma.management.dto.PatientSummaryResponse;
import com.panchakarma.management.dto.TherapistAssignedBookingDto;
import com.panchakarma.management.dto.TherapistWeeklyScheduleDto;
import com.panchakarma.management.dto.TherapistDateOverrideDto;
import com.panchakarma.management.exception.ResourceNotFoundException;
import com.panchakarma.management.model.*;
import com.panchakarma.management.repository.*;
import com.panchakarma.management.service.TherapistService;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.Period;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class TherapistServiceImpl implements TherapistService {

    private final BookingRepository bookingRepository;
    private final UserRepository userRepository;
    private final PatientRepository patientRepository;
    private final TherapistWeeklyScheduleRepository weeklyScheduleRepository;
    private final TherapistDateOverrideRepository dateOverrideRepository;
    private final RecoveryTrackingRepository trackingRepository;
    private final RecoveryPredictionRepository predictionRepository;

    public TherapistServiceImpl(
            BookingRepository bookingRepository,
            UserRepository userRepository,
            PatientRepository patientRepository,
            TherapistWeeklyScheduleRepository weeklyScheduleRepository,
            TherapistDateOverrideRepository dateOverrideRepository,
            RecoveryTrackingRepository trackingRepository,
            RecoveryPredictionRepository predictionRepository) {
        this.bookingRepository = bookingRepository;
        this.userRepository = userRepository;
        this.patientRepository = patientRepository;
        this.weeklyScheduleRepository = weeklyScheduleRepository;
        this.dateOverrideRepository = dateOverrideRepository;
        this.trackingRepository = trackingRepository;
        this.predictionRepository = predictionRepository;
    }

    public List<PatientSummaryResponse> getMyPatients() {
        User user = getCurrentUser();
        return bookingRepository.findByAssignedTo(user).stream()
                .map(booking -> booking.getPatient().getPatient())
                .distinct()
                .map(patient -> {
                    Integer age = null;
                    if (patient.getDateOfBirth() != null) {
                        age = Period.between(patient.getDateOfBirth(), LocalDate.now()).getYears();
                    } else if (patient.getUser() != null && patient.getUser().getAge() != null) {
                        age = patient.getUser().getAge();
                    }
                    String gender = (patient.getGender() != null && !patient.getGender().isBlank())
                            ? patient.getGender()
                            : (patient.getUser() != null ? patient.getUser().getGender() : null);
                    Long targetUserId = (patient.getUser() != null) ? patient.getUser().getId() : patient.getId();
                    return new PatientSummaryResponse(
                            targetUserId,
                            patient.getFirstName() + " " + patient.getLastName(),
                            patient.getEmail(),
                            patient.getContactNumber(),
                            gender,
                            age,
                            patient.getDominantDosha(),
                            patient.isDoshaAssessmentCompleted(),
                            null
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
        if (currentUser == null) return List.of();

        List<Booking> bookings = new ArrayList<>(bookingRepository.findByAssignedTo(currentUser));
        
        // Also check by ID or name matching if list is empty or incomplete
        Set<Long> existingIds = bookings.stream().map(Booking::getBookingId).collect(Collectors.toSet());
        List<Booking> byId = bookingRepository.findByAssignedTo_Id(currentUser.getId());
        for (Booking b : byId) {
            if (b != null && b.getBookingId() != null && !existingIds.contains(b.getBookingId())) {
                bookings.add(b);
                existingIds.add(b.getBookingId());
            }
        }

        if (currentUser.getFullName() != null && !currentUser.getFullName().isBlank()) {
            String nameLower = currentUser.getFullName().toLowerCase().trim();
            List<Booking> allBookings = bookingRepository.findAll();
            for (Booking b : allBookings) {
                if (b != null && b.getBookingId() != null && !existingIds.contains(b.getBookingId())) {
                    String tName = b.getTherapistName() != null ? b.getTherapistName().toLowerCase().trim() : "";
                    if (!tName.isEmpty() && (tName.contains(nameLower) || nameLower.contains(tName))) {
                        bookings.add(b);
                        existingIds.add(b.getBookingId());
                    }
                }
            }
        }

        // Fallback: If no therapist-specific bookings assigned yet, return all clinic bookings
        if (bookings.isEmpty()) {
            bookings = bookingRepository.findAll();
        }

        return bookings.stream()
                .map(booking -> {
                    Long patUserId = booking.getPatient() != null ? booking.getPatient().getId() : null;
                    if (patUserId == null && booking.getPatientEmail() != null && !booking.getPatientEmail().isBlank()) {
                        Optional<User> uOpt = userRepository.findByEmail(booking.getPatientEmail());
                        if (uOpt.isPresent()) {
                            patUserId = uOpt.get().getId();
                        }
                    }

                    boolean hasAssessment = false;
                    boolean hasPrediction = false;
                    Double recoveryPercentage = null;

                    if (patUserId != null) {
                        List<RecoveryTracking> trackings = trackingRepository.findByPatientIdOrderByAssessmentDateDesc(patUserId);
                        if (!trackings.isEmpty()) {
                            hasAssessment = true;
                            recoveryPercentage = trackings.get(0).getCurrentRecoveryPercentage();
                        }
                        List<RecoveryPrediction> predictions = predictionRepository.findByPatientIdOrderByPredictionDateDesc(patUserId);
                        if (!predictions.isEmpty()) {
                            hasPrediction = true;
                        }
                    }

                    return new TherapistAssignedBookingDto(
                            booking.getBookingId(),
                            booking.getPatient() != null ? booking.getPatient().getId() : null,
                            booking.getPatient() != null ? booking.getPatient().getFullName() : null,
                            booking.getBookingType() != null ? booking.getBookingType().toString() : null,
                            booking.getPurpose(),
                            "",
                            booking.getDate(),
                            booking.getTime(),
                            booking.getBookingStatus() != null ? booking.getBookingStatus().toString() : null,
                            booking.getConsultationType(),
                            booking.getConsultationCategory() != null ? booking.getConsultationCategory() : "NORMAL",
                            booking.getMeetLink(),
                            booking.getSessionNotes(),
                            booking.getPatientAdvice(),
                            booking.isRescheduleRequested(),
                            booking.getProposedDate(),
                            booking.getProposedTime(),
                            booking.getRescheduleReason(),
                            booking.isAltSlotsPending(),
                            booking.getDeclineReason(),
                            booking.getAltSlot1Date(),
                            booking.getAltSlot1Time(),
                            booking.getAltSlot2Date(),
                            booking.getAltSlot2Time(),
                            booking.getAltSlot3Date(),
                            booking.getAltSlot3Time(),
                            booking.getPatient() != null ? booking.getPatient().getDominantDosha() : null,
                            booking.getPaymentStatus() != null ? booking.getPaymentStatus().toString() : "UNPAID",
                            booking.getPaymentAmount() != null ? booking.getPaymentAmount() : 0.0,
                            booking.getRazorpayPaymentId(),
                            booking.getRazorpayOrderId(),
                            booking.getPatient() != null ? booking.getPatient().getAge() : null,
                            booking.getPatient() != null ? booking.getPatient().getGender() : null,
                            hasAssessment,
                            hasPrediction,
                            recoveryPercentage
                    );
                })
                .collect(Collectors.toList());
    }

    @Override
    public List<User> listTherapists() {
        return userRepository.findByRole(UserRole.THERAPIST);
    }

    @Override
    public List<TherapistAssignedBookingDto> getAssignedBookingsForPatient(Long patientId) {
        User currentUser = getCurrentUser();
        Patient patient = patientRepository.findById(patientId).orElse(null);
        User patientUser = (patient != null) ? patient.getUser() : null;
        String email = (patient != null) ? patient.getEmail() : null;

        if (patientUser == null) {
            patientUser = userRepository.findById(patientId).orElse(null);
            if (patientUser != null && email == null) {
                email = patientUser.getEmail();
            }
        }

        List<Booking> bookings = new ArrayList<>();

        if (patientUser != null && patientUser.getId() != null) {
            List<Booking> byUser = bookingRepository.findByPatient_Id(patientUser.getId());
            if (byUser != null) bookings.addAll(byUser);
        }

        if (patient != null && patient.getId() != null && (patientUser == null || !patient.getId().equals(patientUser.getId()))) {
            List<Booking> byPatient = bookingRepository.findByPatient_Id(patient.getId());
            if (byPatient != null) {
                for (Booking b : byPatient) {
                    if (bookings.stream().noneMatch(existing -> existing.getBookingId().equals(b.getBookingId()))) {
                        bookings.add(b);
                    }
                }
            }
        }

        if (email != null && !email.isBlank()) {
            List<Booking> byEmail = bookingRepository.findByPatientEmail(email);
            if (byEmail != null) {
                for (Booking b : byEmail) {
                    if (bookings.stream().noneMatch(existing -> existing.getBookingId().equals(b.getBookingId()))) {
                        bookings.add(b);
                    }
                }
            }
        }

        if (bookings.isEmpty() && patientUser != null) {
            List<Booking> assigned = bookingRepository.findByAssignedToAndPatient(currentUser, patientUser);
            if (assigned != null) bookings.addAll(assigned);
        }

        return bookings.stream()
                .map(booking -> {
                    Long patUserId = booking.getPatient() != null ? booking.getPatient().getId() : null;
                    if (patUserId == null && booking.getPatientEmail() != null && !booking.getPatientEmail().isBlank()) {
                        Optional<User> uOpt = userRepository.findByEmail(booking.getPatientEmail());
                        if (uOpt.isPresent()) {
                            patUserId = uOpt.get().getId();
                        }
                    }

                    boolean hasAssessment = false;
                    boolean hasPrediction = false;
                    Double recoveryPercentage = null;

                    if (patUserId != null) {
                        List<RecoveryTracking> trackings = trackingRepository.findByPatientIdOrderByAssessmentDateDesc(patUserId);
                        if (!trackings.isEmpty()) {
                            hasAssessment = true;
                            recoveryPercentage = trackings.get(0).getCurrentRecoveryPercentage();
                        }
                        List<RecoveryPrediction> predictions = predictionRepository.findByPatientIdOrderByPredictionDateDesc(patUserId);
                        if (!predictions.isEmpty()) {
                            hasPrediction = true;
                        }
                    }

                    return new TherapistAssignedBookingDto(
                            booking.getBookingId(),
                            booking.getPatient() != null ? booking.getPatient().getId() : null,
                            booking.getPatient() != null ? booking.getPatient().getFullName() : null,
                            booking.getPurpose() != null && !booking.getPurpose().isBlank()
                                    ? booking.getPurpose()
                                    : (booking.getBookingType() != null ? booking.getBookingType().toString() : "Panchakarma Therapy"),
                            booking.getPurpose(),
                            "",
                            booking.getDate(),
                            booking.getTime(),
                            booking.getBookingStatus() != null ? booking.getBookingStatus().toString() : null,
                            booking.getConsultationType(),
                            booking.getConsultationCategory() != null ? booking.getConsultationCategory() : "THERAPY_RECOMMENDATION",
                            booking.getMeetLink(),
                            booking.getSessionNotes(),
                            booking.getPatientAdvice(),
                            booking.isRescheduleRequested(),
                            booking.getProposedDate(),
                            booking.getProposedTime(),
                            booking.getRescheduleReason(),
                            booking.isAltSlotsPending(),
                            booking.getDeclineReason(),
                            booking.getAltSlot1Date(),
                            booking.getAltSlot1Time(),
                            booking.getAltSlot2Date(),
                            booking.getAltSlot2Time(),
                            booking.getAltSlot3Date(),
                            booking.getAltSlot3Time(),
                            booking.getPatient() != null ? booking.getPatient().getDominantDosha() : null,
                            booking.getPaymentStatus() != null ? booking.getPaymentStatus().toString() : "UNPAID",
                            booking.getPaymentAmount() != null ? booking.getPaymentAmount() : 0.0,
                            booking.getRazorpayPaymentId(),
                            booking.getRazorpayOrderId(),
                            booking.getPatient() != null ? booking.getPatient().getAge() : null,
                            booking.getPatient() != null ? booking.getPatient().getGender() : null,
                            hasAssessment,
                            hasPrediction,
                            recoveryPercentage
                    );
                })
                .collect(Collectors.toList());
    }

    @Override
    public List<TherapistWeeklyScheduleDto> getMyWeeklySchedule() {
        User currentUser = getCurrentUser();
        List<TherapistWeeklySchedule> schedules = weeklyScheduleRepository.findByTherapist(currentUser);

        // Auto-initialize default schedule if not present
        if (schedules.isEmpty()) {
            schedules = new ArrayList<>();
            for (DayOfWeek day : DayOfWeek.values()) {
                TherapistWeeklySchedule schedule = new TherapistWeeklySchedule();
                schedule.setTherapist(currentUser);
                schedule.setDayOfWeek(day);
                if (day == DayOfWeek.SUNDAY) {
                    schedule.setStartTime(null);
                    schedule.setEndTime(null);
                    schedule.setIsAvailable(false);
                } else {
                    schedule.setStartTime(LocalTime.of(9, 0));
                    schedule.setEndTime(LocalTime.of(17, 0));
                    schedule.setIsAvailable(true);
                }
                schedules.add(weeklyScheduleRepository.save(schedule));
            }
        }

        return schedules.stream()
                .sorted(Comparator.comparing(TherapistWeeklySchedule::getDayOfWeek))
                .map(s -> new TherapistWeeklyScheduleDto(
                        s.getId(),
                        s.getDayOfWeek(),
                        s.getStartTime(),
                        s.getEndTime(),
                        s.getIsAvailable()
                ))
                .collect(Collectors.toList());
    }

    @Override
    public List<TherapistWeeklyScheduleDto> updateMyWeeklySchedule(List<TherapistWeeklyScheduleDto> schedulesDto) {
        User currentUser = getCurrentUser();
        List<TherapistWeeklySchedule> updated = new ArrayList<>();

        for (TherapistWeeklyScheduleDto dto : schedulesDto) {
            Optional<TherapistWeeklySchedule> scheduleOpt = weeklyScheduleRepository
                    .findByTherapistAndDayOfWeek(currentUser, dto.dayOfWeek());
            
            TherapistWeeklySchedule schedule;
            if (scheduleOpt.isPresent()) {
                schedule = scheduleOpt.get();
            } else {
                schedule = new TherapistWeeklySchedule();
                schedule.setTherapist(currentUser);
                schedule.setDayOfWeek(dto.dayOfWeek());
            }

            schedule.setStartTime(dto.startTime());
            schedule.setEndTime(dto.endTime());
            schedule.setIsAvailable(dto.isAvailable());

            updated.add(weeklyScheduleRepository.save(schedule));
        }

        return updated.stream()
                .sorted(Comparator.comparing(TherapistWeeklySchedule::getDayOfWeek))
                .map(s -> new TherapistWeeklyScheduleDto(
                        s.getId(),
                        s.getDayOfWeek(),
                        s.getStartTime(),
                        s.getEndTime(),
                        s.getIsAvailable()
                ))
                .collect(Collectors.toList());
    }

    @Override
    public List<TherapistDateOverrideDto> getMyDateOverrides() {
        User currentUser = getCurrentUser();
        return dateOverrideRepository.findByTherapist(currentUser).stream()
                .sorted(Comparator.comparing(TherapistDateOverride::getOverrideDate))
                .map(o -> new TherapistDateOverrideDto(
                        o.getId(),
                        o.getOverrideDate(),
                        o.getStartTime(),
                        o.getEndTime(),
                        o.getIsAvailable()
                ))
                .collect(Collectors.toList());
    }

    @Override
    public TherapistDateOverrideDto createOrUpdateDateOverride(TherapistDateOverrideDto dto) {
        User currentUser = getCurrentUser();
        Optional<TherapistDateOverride> overrideOpt = dateOverrideRepository
                .findByTherapistAndOverrideDate(currentUser, dto.overrideDate());

        TherapistDateOverride override;
        if (overrideOpt.isPresent()) {
            override = overrideOpt.get();
        } else {
            override = new TherapistDateOverride();
            override.setTherapist(currentUser);
            override.setOverrideDate(dto.overrideDate());
        }

        override.setStartTime(dto.startTime());
        override.setEndTime(dto.endTime());
        override.setIsAvailable(dto.isAvailable());

        TherapistDateOverride saved = dateOverrideRepository.save(override);
        return new TherapistDateOverrideDto(
                saved.getId(),
                saved.getOverrideDate(),
                saved.getStartTime(),
                saved.getEndTime(),
                saved.getIsAvailable()
        );
    }

    @Override
    public void deleteDateOverride(Long overrideId) {
        User currentUser = getCurrentUser();
        TherapistDateOverride override = dateOverrideRepository.findById(overrideId)
                .orElseThrow(() -> new ResourceNotFoundException("Override not found with id: " + overrideId));

        if (!override.getTherapist().getId().equals(currentUser.getId())) {
            throw new RuntimeException("Unauthorized to delete this override");
        }

        dateOverrideRepository.delete(override);
    }

    @Override
    public com.panchakarma.management.dto.TherapistWalletDto getTherapistWallet() {
        User currentUser = getCurrentUser();
        List<Booking> myBookings = bookingRepository.findByAssignedTo(currentUser);

        List<com.panchakarma.management.dto.WalletTransactionDto> transactions = new ArrayList<>();
        double totalBalance = 0.0;
        double thisMonthEarnings = 0.0;
        int totalPaidConsultations = 0;

        LocalDate now = LocalDate.now();

        for (Booking booking : myBookings) {
            boolean isPaid = (booking.getPaymentStatus() == PaymentStatus.PAID)
                    || (booking.getPaymentAmount() != null && booking.getPaymentAmount() > 0)
                    || (booking.getBookingType() == BookingType.CONSULTATION && booking.getBookingStatus() == BookingStatus.CONFIRMED);

            if (isPaid) {
                double amount = (booking.getPaymentAmount() != null && booking.getPaymentAmount() > 0)
                        ? booking.getPaymentAmount()
                        : 500.00;

                totalBalance += amount;
                totalPaidConsultations++;

                if (booking.getDate() != null && booking.getDate().getMonth() == now.getMonth() && booking.getDate().getYear() == now.getYear()) {
                    thisMonthEarnings += amount;
                }

                String razorpayPayId = booking.getRazorpayPaymentId() != null ? booking.getRazorpayPaymentId() : "pay_razorpay_" + booking.getBookingId();
                String razorpayOrdId = booking.getRazorpayOrderId() != null ? booking.getRazorpayOrderId() : "order_rzp_" + booking.getBookingId();

                transactions.add(new com.panchakarma.management.dto.WalletTransactionDto(
                        booking.getBookingId(),
                        booking.getPatient() != null ? booking.getPatient().getId() : null,
                        booking.getPatientName() != null ? booking.getPatientName() : (booking.getPatient() != null ? booking.getPatient().getFullName() : "Patient"),
                        booking.getPatientEmail() != null ? booking.getPatientEmail() : (booking.getPatient() != null ? booking.getPatient().getEmail() : "patient@panchakarma.com"),
                        booking.getDate(),
                        booking.getTime(),
                        booking.getPurpose() != null ? booking.getPurpose() : "Consultation Fee",
                        amount,
                        "PAID",
                        razorpayPayId,
                        razorpayOrdId,
                        booking.getConsultationType(),
                        booking.getCreatedAt()
                ));
            }
        }

        // Sort transactions descending by date
        transactions.sort((t1, t2) -> {
            if (t1.date() == null) return 1;
            if (t2.date() == null) return -1;
            return t2.date().compareTo(t1.date());
        });

        String bankAccountName = currentUser.getFullName() + " (Ayurveda Specialist)";
        String bankAccountNumber = "XXXX-XXXX-4829";
        String bankIfscCode = "HDFC0001842";

        return new com.panchakarma.management.dto.TherapistWalletDto(
                totalBalance,
                thisMonthEarnings,
                totalPaidConsultations,
                bankAccountName,
                bankAccountNumber,
                bankIfscCode,
                transactions
        );
    }
}