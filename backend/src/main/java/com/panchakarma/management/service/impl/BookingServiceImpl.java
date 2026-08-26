package com.panchakarma.management.service.impl;

import java.util.List;
import java.util.stream.Collectors;
import java.time.LocalDateTime;
import java.time.LocalTime;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.panchakarma.management.dto.BookingRequest;
import com.panchakarma.management.dto.BookingResponse;
import com.panchakarma.management.dto.AutoBookingRequest;
import com.panchakarma.management.dto.AutoBookingResponse;
import com.panchakarma.management.dto.GoogleMeetRequest;
import com.panchakarma.management.dto.AvailableSlotResponse;
import com.panchakarma.management.exception.ResourceNotFoundException;
import com.panchakarma.management.model.Booking;
import com.panchakarma.management.model.ConsultationType;
import com.panchakarma.management.model.TherapistAvailability;
import com.panchakarma.management.model.Patient;
import com.panchakarma.management.model.User;
import com.panchakarma.management.model.BookingStatus;
import com.panchakarma.management.model.BookingType;
import com.panchakarma.management.repository.BookingRepository;
import com.panchakarma.management.repository.PatientRepository;
import com.panchakarma.management.repository.UserRepository;
import com.panchakarma.management.service.BookingService;
import com.panchakarma.management.service.GoogleMeetService;
import com.panchakarma.management.service.AvailabilityService;
import com.panchakarma.management.service.NotificationService;
import com.panchakarma.management.websocket.BookingWebSocketHandler;
import com.panchakarma.management.service.EmailService;
import java.util.concurrent.CompletableFuture;

@Service
public class BookingServiceImpl implements BookingService {

    @Autowired
    private BookingRepository bookingRepository;

    @Autowired
    private PatientRepository patientRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private GoogleMeetService googleMeetService;

    @Autowired
    private AvailabilityService availabilityService;

    @Autowired
    private BookingWebSocketHandler bookingWebSocketHandler;

    @Autowired
    private NotificationService notificationService;

    @Autowired
    private EmailService emailService;

    @Override
    public BookingResponse createBooking(BookingRequest bookingRequest) {
        synchronized (this) {
            User patient = userRepository.findById(bookingRequest.getPatientId())
                    .orElseThrow(() -> new ResourceNotFoundException(
                            "Patient not found with id: " + bookingRequest.getPatientId()));

            // Validation: Only 1st therapy session after consultation can be booked by patient
            if (bookingRequest.getBookingType() == BookingType.THERAPY) {
                List<Booking> existingBookings = bookingRepository.findByPatient_Id(patient.getId());
                java.util.Optional<Booking> latestCons = existingBookings.stream()
                        .filter(b -> b.getBookingType() == BookingType.CONSULTATION &&
                                    (b.getBookingStatus() == BookingStatus.COMPLETED || b.getBookingStatus() == BookingStatus.CONFIRMED))
                        .max(java.util.Comparator.comparing(Booking::getCreatedAt, java.util.Comparator.nullsFirst(java.util.Comparator.naturalOrder())));

                if (latestCons.isPresent()) {
                    java.time.LocalDateTime consTime = latestCons.get().getCreatedAt() != null ? latestCons.get().getCreatedAt() : latestCons.get().getDate().atStartOfDay();
                    boolean alreadyBooked1stSession = existingBookings.stream()
                            .filter(b -> b.getBookingType() == BookingType.THERAPY && b.getBookingStatus() != BookingStatus.CANCELLED)
                            .anyMatch(b -> {
                                java.time.LocalDateTime bTime = b.getCreatedAt() != null ? b.getCreatedAt() : b.getDate().atStartOfDay();
                                return !bTime.isBefore(consTime);
                            });

                    if (alreadyBooked1stSession) {
                        throw new org.springframework.web.server.ResponseStatusException(
                                org.springframework.http.HttpStatus.BAD_REQUEST,
                                "Only the 1st therapy session after consultation can be booked by the patient. Remaining sessions are scheduled by your therapist and can be rescheduled under My Appointments."
                        );
                    }
                }
            }

            int totalSessions = (bookingRequest.getTotalSessions() != null && bookingRequest.getTotalSessions() > 1) 
                    ? bookingRequest.getTotalSessions() : 1;
            String packageId = totalSessions > 1 ? "PKG-" + System.currentTimeMillis() + "-" + (int)(Math.random() * 1000) : bookingRequest.getPackageId();

            Booking firstSavedBooking = null;

            int dayGap = getDayGapForFrequency(bookingRequest.getFrequency());

            for (int sessionIdx = 1; sessionIdx <= totalSessions; sessionIdx++) {
                int dayOffset = (sessionIdx - 1) * dayGap;
                java.time.LocalDate baseDate = bookingRequest.getDate() != null ? bookingRequest.getDate() : java.time.LocalDate.now();
                java.time.LocalDate sessionDate = baseDate.plusDays(dayOffset);

                Booking booking = new Booking();
                booking.setPatient(patient);
                booking.setPatientName(patient.getFullName());
                booking.setPatientEmail(patient.getEmail());

                Long resolvedTherapistId = null;

                if (bookingRequest.getAssignedToId() != null && bookingRequest.getAssignedToId() > 0) {
                    final Long reqTherapistId = bookingRequest.getAssignedToId();
                    User assignedTo = userRepository.findById(reqTherapistId).orElse(null);
                    if (assignedTo != null) {
                        booking.setAssignedTo(assignedTo);
                        booking.setTherapistName(assignedTo.getFullName());
                        resolvedTherapistId = reqTherapistId;
                    } else {
                        User leastLoaded = pickLeastLoadedTherapist(sessionDate);
                        booking.setAssignedTo(leastLoaded);
                        if (leastLoaded != null) booking.setTherapistName(leastLoaded.getFullName());
                        resolvedTherapistId = leastLoaded != null ? leastLoaded.getId() : null;
                    }
                } else {
                    // Auto-assign least-loaded therapist (load-balancing across all therapists)
                    User leastLoaded = pickLeastLoadedTherapist(sessionDate);
                    booking.setAssignedTo(leastLoaded);
                    if (leastLoaded != null) booking.setTherapistName(leastLoaded.getFullName());
                    resolvedTherapistId = leastLoaded != null ? leastLoaded.getId() : null;
                }

                booking.setDate(sessionDate);
                java.time.LocalTime resolvedTime = resolveAvailableTimeSlotForDate(
                    resolvedTherapistId,
                    sessionDate,
                    bookingRequest.getTime()
                );
                booking.setTime(resolvedTime);

                String purposeText;
                if (totalSessions > 1) {
                    String phaseName;
                    switch (sessionIdx) {
                        case 1: phaseName = "Purvakarma - Assessment & Initial Abhyanga"; break;
                        case 2: phaseName = "Oleation Phase - Shirodhara Oil Therapy"; break;
                        case 3: phaseName = "Pradhanakarma - Main Virechana Detox Session"; break;
                        case 4: phaseName = "Paschatkarma - Samsarjana Recovery Assessment"; break;
                        case 5: phaseName = "Rasayana - Rejuvenation & Vitality Therapy"; break;
                        default: phaseName = "Follow-Up Clinical Evaluation"; break;
                    }
                    String basePurpose = bookingRequest.getPurpose() != null ? bookingRequest.getPurpose() : "Panchakarma Package";
                    purposeText = basePurpose + " (" + phaseName + " • Session " + sessionIdx + " of " + totalSessions + ")";
                } else {
                    purposeText = bookingRequest.getPurpose() != null ? bookingRequest.getPurpose() : "Panchakarma Session";
                }

                booking.setPurpose(purposeText);
                booking.setBookingType(bookingRequest.getBookingType());
                booking.setBookingStatus(bookingRequest.getBookingStatus() != null ? bookingRequest.getBookingStatus() : BookingStatus.CONFIRMED);
                booking.setConsultationType(bookingRequest.getConsultationType());
                booking.setConsultationCategory(bookingRequest.getConsultationCategory() != null ? bookingRequest.getConsultationCategory() : "NORMAL");
                booking.setPackageId(packageId);
                booking.setSessionNumber(sessionIdx);
                booking.setTotalSessions(totalSessions);

                // Schedule Google Meet if online consultation for 1st session
                if (sessionIdx == 1 && bookingRequest.getConsultationType() == ConsultationType.ONLINE) {
                    try {
                        LocalDateTime startDateTime = booking.getDate().atTime(booking.getTime());
                        LocalDateTime endDateTime = startDateTime.plusMinutes(45);

                        String doctorEmail = booking.getAssignedTo() != null ? booking.getAssignedTo().getEmail() : "consultation@panchakarma.com";
                        String doctorName = booking.getAssignedTo() != null ? " with " + booking.getAssignedTo().getFullName() : "";

                        GoogleMeetRequest meetRequest = new GoogleMeetRequest(
                            "Panchakarma Consultation" + doctorName,
                            startDateTime,
                            endDateTime,
                            patient.getEmail(),
                            doctorEmail
                        );

                        var meetResponse = googleMeetService.scheduleMeeting(meetRequest);
                        booking.setMeetLink(meetResponse.meetLink());
                        booking.setEventId(meetResponse.eventId());
                    } catch (Exception e) {
                        System.err.println("Failed to schedule Google Meet: " + e.getMessage());
                    }
                }

                Booking savedBooking = bookingRepository.save(booking);
                if (firstSavedBooking == null) {
                    firstSavedBooking = savedBooking;
                }

                Long therapistId = savedBooking.getAssignedTo() != null ? savedBooking.getAssignedTo().getId() : null;
                bookingWebSocketHandler.broadcastBookingUpdate(therapistId, savedBooking.getDate().toString());
            }

            // Create in-app notifications according to patient preferences
            try {
                boolean allowPatientInApp = bookingRequest.getInAppNotifEnabled() == null || Boolean.TRUE.equals(bookingRequest.getInAppNotifEnabled());
                boolean allowPatientEmail = bookingRequest.getEmailNotifEnabled() == null || Boolean.TRUE.equals(bookingRequest.getEmailNotifEnabled());

                if (allowPatientInApp) {
                    String patientMsg = totalSessions > 1
                        ? String.format("Your %d-day %s therapy package starting %s has been automatically booked (Package ID: %s).",
                                totalSessions, firstSavedBooking.getBookingType(), firstSavedBooking.getDate(), packageId)
                        : String.format("Your booking for %s on %s at %s has been confirmed.%s",
                                firstSavedBooking.getBookingType(),
                                firstSavedBooking.getDate(),
                                firstSavedBooking.getTime(),
                                firstSavedBooking.getMeetLink() != null ? " Google Meet Link: " + firstSavedBooking.getMeetLink() : "");
                    notificationService.createNotification(patient, "Booking Confirmed", patientMsg, "/dashboard/patient?tab=appointments&bookingId=" + firstSavedBooking.getBookingId());
                }

                if (allowPatientEmail && patient.getEmail() != null && !patient.getEmail().isBlank()) {
                    try {
                        String emailSubject = "Panchakarma Booking Confirmation - #" + firstSavedBooking.getBookingId();
                        String emailBody = String.format("Dear %s,\n\nYour Panchakarma session (%s) on %s at %s has been successfully booked.\n\nThank you for choosing Panchakarma Care Center.",
                                patient.getFullName(), firstSavedBooking.getBookingType(), firstSavedBooking.getDate(), firstSavedBooking.getTime());
                        emailService.sendBookingConfirmation(patient.getEmail(), emailSubject, emailBody);
                    } catch (Exception ex) {
                        System.err.println("Email dispatch log: " + ex.getMessage());
                    }
                }

                if (firstSavedBooking.getAssignedTo() != null) {
                    String therapistMsg = totalSessions > 1
                        ? String.format("A new %d-day package for %s with patient %s starting %s has been assigned to you.",
                                totalSessions, firstSavedBooking.getBookingType(), firstSavedBooking.getPatientName(), firstSavedBooking.getDate())
                        : String.format("A new session for %s with patient %s has been scheduled on %s at %s.",
                                firstSavedBooking.getBookingType(),
                                firstSavedBooking.getPatientName(),
                                firstSavedBooking.getDate(),
                                firstSavedBooking.getTime());
                    notificationService.createNotification(firstSavedBooking.getAssignedTo(), "New Booking Assigned", therapistMsg, "/dashboard/therapist?bookingId=" + firstSavedBooking.getBookingId());
                }
            } catch (Exception e) {
                System.err.println("Failed to process booking notifications: " + e.getMessage());
            }

            return mapToBookingResponse(firstSavedBooking);
        }
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
            booking.setAssignedTo(null);
        }

        BookingStatus oldStatus = booking.getBookingStatus();
        booking.setDate(bookingRequest.getDate());
        booking.setTime(bookingRequest.getTime());
        booking.setPurpose(bookingRequest.getPurpose());
        booking.setBookingType(bookingRequest.getBookingType());
        booking.setBookingStatus(bookingRequest.getBookingStatus());
        booking.setConsultationType(bookingRequest.getConsultationType());

        Booking updatedBooking = bookingRepository.save(booking);

        // Send notifications if status changed to CONFIRMED or CANCELLED
        try {
            if (oldStatus != updatedBooking.getBookingStatus()) {
                String patientName = updatedBooking.getPatient() != null ? updatedBooking.getPatient().getFullName() : (updatedBooking.getPatientName() != null ? updatedBooking.getPatientName() : "Patient");
                String typeName = updatedBooking.getBookingType() != null ? updatedBooking.getBookingType().toString() : "Therapy Session";
                String dateStr = updatedBooking.getDate() != null ? updatedBooking.getDate().toString() : "";
                String timeStr = updatedBooking.getTime() != null ? updatedBooking.getTime().toString() : "";
                String therapistName = updatedBooking.getAssignedTo() != null ? updatedBooking.getAssignedTo().getFullName() : "Care Team";

                if (updatedBooking.getBookingStatus() == BookingStatus.CONFIRMED) {
                    if (updatedBooking.getPatient() != null) {
                        String patientMsg = String.format("Your booking for %s on %s at %s has been confirmed.", typeName, dateStr, timeStr);
                        notificationService.createNotification(updatedBooking.getPatient(), "Booking Confirmed ✅", patientMsg, "/dashboard/patient?tab=appointments&bookingId=" + updatedBooking.getBookingId());

                        // Email on CONFIRMED (checked against patient's emailNotifEnabled preference)
                        if (updatedBooking.getPatient().isEmailNotifEnabled()) {
                            String patientEmail = updatedBooking.getPatient().getEmail();
                            if (patientEmail != null && !patientEmail.isBlank()) {
                                try {
                                    emailService.sendBookingConfirmation(patientEmail,
                                        "Booking Confirmed — " + typeName,
                                        String.format("Dear %s,\n\nYour %s booking on %s at %s has been confirmed by %s.\n\nPlease arrive 10 minutes early.\n\nWarm regards,\nPanchakarma Management Team",
                                            patientName, typeName, dateStr, timeStr, therapistName));
                                } catch (Exception ex) {
                                    System.err.println("Booking confirmed email failed: " + ex.getMessage());
                                }
                            }
                        }
                    }
                    if (updatedBooking.getAssignedTo() != null) {
                        String therapistMsg = String.format("A session for %s with patient %s has been confirmed for %s at %s.", typeName, patientName, dateStr, timeStr);
                        notificationService.createNotification(updatedBooking.getAssignedTo(), "Booking Confirmed 🌿", therapistMsg, "/dashboard/therapist?bookingId=" + updatedBooking.getBookingId());
                    }
                } else if (updatedBooking.getBookingStatus() == BookingStatus.CANCELLED) {
                    if (updatedBooking.getPatient() != null) {
                        String patientMsg = String.format("Your %s booking for %s at %s has been cancelled.", typeName, dateStr, timeStr);
                        notificationService.createNotification(updatedBooking.getPatient(), "Booking Cancelled ❌", patientMsg, "/dashboard/patient?tab=appointments&bookingId=" + updatedBooking.getBookingId());

                        // Email on CANCELLED (checked against patient's emailNotifEnabled preference)
                        if (updatedBooking.getPatient().isEmailNotifEnabled()) {
                            String patientEmail = updatedBooking.getPatient().getEmail();
                            if (patientEmail != null && !patientEmail.isBlank()) {
                                try {
                                    emailService.sendBookingConfirmation(patientEmail,
                                        "Booking Cancelled — " + typeName,
                                        String.format("Dear %s,\n\nYour %s booking on %s at %s has been cancelled.\n\nIf you have questions, please contact our clinic.\n\nWarm regards,\nPanchakarma Management Team",
                                            patientName, typeName, dateStr, timeStr));
                                } catch (Exception ex) {
                                    System.err.println("Booking cancelled email failed: " + ex.getMessage());
                                }
                            }
                        }
                    }
                    if (updatedBooking.getAssignedTo() != null) {
                        String therapistMsg = String.format("The %s session with patient %s scheduled on %s at %s has been cancelled.", typeName, patientName, dateStr, timeStr);
                        notificationService.createNotification(updatedBooking.getAssignedTo(), "Booking Cancelled ❌", therapistMsg, "/dashboard/therapist?bookingId=" + updatedBooking.getBookingId());
                    }
                }
            }
        } catch (Exception e) {
            System.err.println("Failed to send status update notification: " + e.getMessage());
        }
        
        Long therapistId = updatedBooking.getAssignedTo() != null ? updatedBooking.getAssignedTo().getId() : null;
        bookingWebSocketHandler.broadcastBookingUpdate(therapistId, updatedBooking.getDate().toString());

        return mapToBookingResponse(updatedBooking);
    }

    @Override
    public void deleteBooking(Long id) {
        Booking booking = bookingRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Booking not found with id: " + id));
        Long therapistId = booking.getAssignedTo() != null ? booking.getAssignedTo().getId() : null;
        String dateStr = booking.getDate().toString();
        bookingRepository.delete(booking);
        
        bookingWebSocketHandler.broadcastBookingUpdate(therapistId, dateStr);
    }

    private BookingResponse mapToBookingResponse(Booking booking) {
        BookingResponse.TherapistSummaryResponse assignedTo = null;
        if (booking.getAssignedTo() != null) {
            assignedTo = new BookingResponse.TherapistSummaryResponse(
                    booking.getAssignedTo().getId(),
                    booking.getAssignedTo().getFullName()
            );
        }

        BookingStatus status = booking.getBookingStatus();
        if (status != BookingStatus.CANCELLED && status != BookingStatus.COMPLETED && booking.getDate() != null && booking.getTime() != null) {
            try {
                java.time.LocalDateTime bookingDateTime = booking.getDate().atTime(booking.getTime());
                if (java.time.LocalDateTime.now().isAfter(bookingDateTime)) {
                    status = BookingStatus.COMPLETED;
                }
            } catch (Exception ignored) {}
        }

        return new BookingResponse(
                booking.getBookingId(),
                booking.getBookingType(),
                booking.getDate(),
                booking.getTime(),
                booking.getPurpose(),
                status,
                booking.getConsultationType(),
                booking.getConsultationCategory() != null ? booking.getConsultationCategory() : "NORMAL",
                booking.getMeetLink(),
                assignedTo,
                booking.getSessionNotes(),
                booking.getPatientAdvice(),
                booking.isRescheduleRequested(),
                booking.getProposedDate(),
                booking.getProposedTime(),
                booking.getRescheduleReason(),
                booking.getPackageId(),
                booking.getSessionNumber(),
                booking.getTotalSessions(),
                booking.getPatientName() != null ? booking.getPatientName() : (booking.getPatient() != null ? booking.getPatient().getFullName() : null),
                booking.getPatientEmail() != null ? booking.getPatientEmail() : (booking.getPatient() != null ? booking.getPatient().getEmail() : null),
                booking.isAltSlotsPending(),
                booking.getDeclineReason(),
                booking.getAltSlot1Date(),
                booking.getAltSlot1Time(),
                booking.getAltSlot2Date(),
                booking.getAltSlot2Time(),
                booking.getAltSlot3Date(),
                booking.getAltSlot3Time(),
                booking.getPaymentStatus(),
                booking.getPaymentAmount(),
                booking.getRazorpayOrderId(),
                booking.getRazorpayPaymentId()
        );
    }

    @Override
    public List<BookingResponse> getBookingsByPatientId(Long patientId) {
        return bookingRepository.findByPatient_Id(patientId).stream()
                .sorted((b1, b2) -> Long.compare(b2.getBookingId(), b1.getBookingId()))
                .map(this::mapToBookingResponse)
                .collect(Collectors.toList());
    }

    @Override
    public AutoBookingResponse autoScheduleConsultation(AutoBookingRequest request) {
        synchronized (this) {
            User patient = userRepository.findById(request.patientId())
                    .orElseThrow(() -> new ResourceNotFoundException(
                            "Patient not found with id: " + request.patientId()));

            // Find next available slot using capped round-robin load balancing
            java.time.LocalDate targetDate = request.preferredDate() != null ? request.preferredDate() : java.time.LocalDate.now().plusDays(1);
            User therapist = null;
            if (request.preferredTherapistId() != null) {
                therapist = userRepository.findById(request.preferredTherapistId()).orElse(null);
            }
            if (therapist == null) {
                therapist = pickLeastLoadedTherapist(targetDate);
            }
            if (therapist == null) {
                throw new RuntimeException("No therapists available to schedule a consultation at this time.");
            }

            // Resolve a free time slot for the selected therapist
            java.time.LocalTime resolvedTime = resolveAvailableTimeSlotForDate(therapist.getId(), targetDate, java.time.LocalTime.of(10, 0));

            // Create booking with auto-scheduled time
            Booking booking = new Booking();
            booking.setPatient(patient);
            booking.setPatientName(patient.getFullName());
            booking.setPatientEmail(patient.getEmail());
            booking.setAssignedTo(therapist);
            booking.setTherapistName(therapist.getFullName());
            booking.setDate(targetDate);
            booking.setTime(resolvedTime);
            booking.setPurpose(request.reason() + (request.notes() != null ? " — " + request.notes() : ""));
            booking.setBookingType(BookingType.CONSULTATION);
            booking.setBookingStatus(BookingStatus.PENDING);
            booking.setConsultationType(ConsultationType.ONLINE);

            // Try to create a Google Meet link
            try {
                LocalDateTime startDateTime = targetDate.atTime(resolvedTime);
                LocalDateTime endDateTime = startDateTime.plusMinutes(45);
                GoogleMeetRequest meetRequest = new GoogleMeetRequest(
                    "Panchakarma Online Consultation with " + therapist.getFullName(),
                    startDateTime, endDateTime,
                    patient.getEmail(), therapist.getEmail());
                var meetResponse = googleMeetService.scheduleMeeting(meetRequest);
                if (meetResponse != null && meetResponse.meetLink() != null) {
                    booking.setMeetLink(meetResponse.meetLink());
                    String meetId = meetResponse.meetLink().substring(meetResponse.meetLink().lastIndexOf("/") + 1);
                    booking.setEventId(meetId);
                }
            } catch (Exception e) {
                System.err.println("Google Meet creation skipped: " + e.getMessage());
            }

            Booking savedBooking = bookingRepository.save(booking);

            // Create in-app notifications for Patient & Therapist based on patient preferences
            try {
                boolean allowPatientInApp = request.inAppNotifEnabled() == null || Boolean.TRUE.equals(request.inAppNotifEnabled());
                boolean allowPatientEmail = request.emailNotifEnabled() == null || Boolean.TRUE.equals(request.emailNotifEnabled());

                if (allowPatientInApp) {
                    String patientMsg = String.format("Your online consultation for %s at %s has been booked.%s",
                            savedBooking.getDate(), savedBooking.getTime(),
                            savedBooking.getMeetLink() != null ? " Google Meet Link: " + savedBooking.getMeetLink() : "");
                    notificationService.createNotification(patient, "Booking Scheduled 🩺", patientMsg, "/dashboard/patient?tab=appointments&bookingId=" + savedBooking.getBookingId());
                }

                if (allowPatientEmail && patient.getEmail() != null && !patient.getEmail().isBlank()) {
                    try {
                        String emailSubject = "Panchakarma Consultation Scheduled - #" + savedBooking.getBookingId();
                        String emailBody = String.format("Dear %s,\n\nYour online consultation on %s at %s has been auto-scheduled.\nMeet Link: %s\n\nThank you for choosing Panchakarma Care Center.",
                                patient.getFullName(), savedBooking.getDate(), savedBooking.getTime(), savedBooking.getMeetLink() != null ? savedBooking.getMeetLink() : "In-Clinic");
                        emailService.sendBookingConfirmation(patient.getEmail(), emailSubject, emailBody);
                    } catch (Exception ex) {
                        System.err.println("Auto-schedule email log: " + ex.getMessage());
                    }
                }

                if (therapist != null) {
                    String therapistMsg = String.format("A new online consultation with patient %s has been assigned on %s at %s.",
                            patient.getFullName(), savedBooking.getDate(), savedBooking.getTime());
                    notificationService.createNotification(therapist, "New Consultation Assigned 🩺", therapistMsg, "/dashboard/therapist?bookingId=" + savedBooking.getBookingId());
                }
            } catch (Exception e) {
                System.err.println("Failed to create auto-scheduled notifications: " + e.getMessage());
            }

            // Broadcast WebSocket update
            Long therapistId = savedBooking.getAssignedTo() != null ? savedBooking.getAssignedTo().getId() : null;
            bookingWebSocketHandler.broadcastBookingUpdate(therapistId, savedBooking.getDate().toString());

            return new AutoBookingResponse(
                savedBooking.getBookingId(),
                therapist.getId(),
                therapist.getFullName(),
                savedBooking.getDate(),
                savedBooking.getTime(),
                savedBooking.getTime() != null ? savedBooking.getTime().plusMinutes(45) : null,
                savedBooking.getMeetLink(),
                "Consultation auto-scheduled successfully!",
                savedBooking.getPaymentStatus(),
                savedBooking.getPaymentAmount(),
                savedBooking.getRazorpayOrderId(),
                savedBooking.getRazorpayPaymentId()
            );
        }
    }

    @Override
    @org.springframework.transaction.annotation.Transactional
    public BookingResponse updateSessionDetails(Long id, String sessionNotes, String patientAdvice, String status) {
        Booking booking = bookingRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Booking not found with id: " + id));
        
        // Allow completion by therapist at any time without blocking on system clock/time zone difference

        booking.setSessionNotes(sessionNotes);
        booking.setPatientAdvice(patientAdvice);
        if (status != null && !status.isBlank()) {
            booking.setBookingStatus(BookingStatus.valueOf(status.toUpperCase()));
        }
        
        Booking saved = bookingRepository.save(booking);
        
        // Send post care email to patient
        String recipientEmail = null;
        if (saved.getPatient() != null && saved.getPatient().getEmail() != null && !saved.getPatient().getEmail().isBlank()) {
            recipientEmail = saved.getPatient().getEmail();
        } else if (saved.getPatientEmail() != null && !saved.getPatientEmail().isBlank()) {
            recipientEmail = saved.getPatientEmail();
        } else if (saved.getPatientName() != null && !saved.getPatientName().isBlank()) {
            userRepository.findAll().stream()
                .filter(u -> u.getFullName() != null && u.getFullName().equalsIgnoreCase(saved.getPatientName().trim()))
                .findFirst()
                .ifPresent(u -> {
                    if (u.getEmail() != null) {
                        saved.setPatientEmail(u.getEmail());
                        bookingRepository.save(saved);
                    }
                });
            recipientEmail = saved.getPatientEmail();
        }

        if (recipientEmail != null && !recipientEmail.isBlank()) {
            String patientName = saved.getPatient() != null ? saved.getPatient().getFullName() : saved.getPatientName();
            String therapistName = saved.getAssignedTo() != null ? saved.getAssignedTo().getFullName() : saved.getTherapistName();
            String therapyName = saved.getTherapyName() != null ? saved.getTherapyName() : (saved.getPurpose() != null ? saved.getPurpose() : "Panchakarma Session");
            String dateStr = saved.getDate() != null ? saved.getDate().toString() : "";

            try {
                emailService.sendPostCareEmail(
                    recipientEmail,
                    patientName,
                    therapyName,
                    dateStr,
                    saved.getSessionNotes(),
                    saved.getPatientAdvice(),
                    therapistName
                );
            } catch (Exception e) {
                System.err.println("Failed to send post-care email to " + recipientEmail + ": " + e.getMessage());
            }
        } else {
            System.err.println("Could not find recipient email for booking ID: " + saved.getBookingId());
        }

        // Broadcast WebSocket update
        Long therapistId = saved.getAssignedTo() != null ? saved.getAssignedTo().getId() : null;
        bookingWebSocketHandler.broadcastBookingUpdate(therapistId, saved.getDate().toString());
        
        return mapToBookingResponse(saved);
    }

    private void validateEligibility(Booking booking, String action) {
        // Flexible real-time scheduling: allow patients to request rescheduling/cancellation anytime
    }

    @Override
    @org.springframework.transaction.annotation.Transactional
    public BookingResponse requestReschedule(Long id, java.time.LocalDate proposedDate, java.time.LocalTime proposedTime, String reason) {
        Booking booking = bookingRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Booking not found with id: " + id));
        
        validateEligibility(booking, "reschedule");
        
        booking.setRescheduleRequested(true);
        booking.setProposedDate(proposedDate);
        booking.setProposedTime(proposedTime);
        booking.setRescheduleReason(reason);
        // Clear any previous alt slots when a new reschedule request is made
        booking.setAltSlotsPending(false);
        booking.setDeclineReason(null);
        booking.setAltSlot1Date(null);
        booking.setAltSlot1Time(null);
        booking.setAltSlot2Date(null);
        booking.setAltSlot2Time(null);
        booking.setAltSlot3Date(null);
        booking.setAltSlot3Time(null);
        
        Booking saved = bookingRepository.save(booking);
        
        // Notify therapist about the reschedule request
        if (saved.getAssignedTo() != null) {
            String patientName = saved.getPatient() != null ? saved.getPatient().getFullName() : saved.getPatientName();
            notificationService.createNotification(saved.getAssignedTo(), "Reschedule Request",
                    String.format("Patient %s has requested to reschedule their %s booking from %s to %s at %s. Reason: %s",
                            patientName, saved.getBookingType(), saved.getDate(), proposedDate, proposedTime,
                            reason != null && !reason.isBlank() ? reason : "Not specified"), "/dashboard/therapist?bookingId=" + saved.getBookingId());
        }
        
        // Broadcast WebSocket update
        Long therapistId = saved.getAssignedTo() != null ? saved.getAssignedTo().getId() : null;
        bookingWebSocketHandler.broadcastBookingUpdate(therapistId, saved.getDate().toString());
        
        return mapToBookingResponse(saved);
    }

    @Override
    @org.springframework.transaction.annotation.Transactional
    public BookingResponse respondReschedule(Long id, boolean approved, String declineReason,
            java.time.LocalDate altSlot1Date, java.time.LocalTime altSlot1Time,
            java.time.LocalDate altSlot2Date, java.time.LocalTime altSlot2Time,
            java.time.LocalDate altSlot3Date, java.time.LocalTime altSlot3Time) {
        Booking booking = bookingRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Booking not found with id: " + id));
        
        String patientName = booking.getPatient() != null ? booking.getPatient().getFullName() : booking.getPatientName();
        String therapistName = booking.getAssignedTo() != null ? booking.getAssignedTo().getFullName() : booking.getTherapistName();
        
        String patientEmail = null;
        if (booking.getPatient() != null && booking.getPatient().getEmail() != null && !booking.getPatient().getEmail().isBlank()) {
            patientEmail = booking.getPatient().getEmail();
        } else if (booking.getPatientEmail() != null && !booking.getPatientEmail().isBlank()) {
            patientEmail = booking.getPatientEmail();
        } else if (patientName != null && !patientName.isBlank()) {
            patientEmail = userRepository.findAll().stream()
                .filter(u -> u.getFullName() != null && u.getFullName().equalsIgnoreCase(patientName.trim()))
                .map(User::getEmail)
                .findFirst()
                .orElse(null);
        }
        
        if (approved && booking.getProposedDate() != null && booking.getProposedTime() != null) {
            // --- APPROVE PATH ---
            String oldDateStr = booking.getDate().toString();
            java.time.LocalDate newDate = booking.getProposedDate();
            java.time.LocalTime newTime = booking.getProposedTime();
            booking.setDate(newDate);
            booking.setTime(newTime);
            booking.setBookingStatus(BookingStatus.CONFIRMED);
            
            // Clear all reschedule & alt fields
            clearRescheduleFields(booking);
            
            // Broadcast for old date as well
            Long therapistIdOld = booking.getAssignedTo() != null ? booking.getAssignedTo().getId() : null;
            bookingWebSocketHandler.broadcastBookingUpdate(therapistIdOld, oldDateStr);
            
            // Notify patient: approved
            if (booking.getPatient() != null) {
                notificationService.createNotification(booking.getPatient(), "Reschedule Approved ✅",
                        String.format("Your reschedule request has been approved! Your %s booking has been moved to %s at %s.",
                                booking.getBookingType(), newDate, newTime), "/dashboard/patient?tab=appointments&bookingId=" + booking.getBookingId());
            }
            
            // Email patient: approved
            if (patientEmail != null && !patientEmail.isBlank()) {
                try {
                    emailService.sendRescheduleApprovedEmail(patientEmail, patientName, 
                            booking.getBookingType() != null ? booking.getBookingType().toString() : "Therapy",
                            newDate.toString(), newTime.toString(), therapistName);
                } catch (Exception e) {
                    System.err.println("Failed to send reschedule approved email: " + e.getMessage());
                }
            }
        } else {
            // --- DECLINE PATH: set alternative slots ---
            booking.setRescheduleRequested(false);
            booking.setProposedDate(null);
            booking.setProposedTime(null);
            booking.setRescheduleReason(null);
            
            booking.setAltSlotsPending(true);
            booking.setDeclineReason(declineReason);
            booking.setAltSlot1Date(altSlot1Date);
            booking.setAltSlot1Time(altSlot1Time);
            booking.setAltSlot2Date(altSlot2Date);
            booking.setAltSlot2Time(altSlot2Time);
            booking.setAltSlot3Date(altSlot3Date);
            booking.setAltSlot3Time(altSlot3Time);
            
            // Build alternatives text for notification
            StringBuilder altText = new StringBuilder();
            if (altSlot1Date != null) altText.append("\n  • ").append(altSlot1Date).append(" at ").append(altSlot1Time);
            if (altSlot2Date != null) altText.append("\n  • ").append(altSlot2Date).append(" at ").append(altSlot2Time);
            if (altSlot3Date != null) altText.append("\n  • ").append(altSlot3Date).append(" at ").append(altSlot3Time);
            
            // Notify patient: declined with alternatives
            if (booking.getPatient() != null) {
                notificationService.createNotification(booking.getPatient(), "Reschedule Declined — Choose Alternative",
                        String.format("Your reschedule request was declined by %s.%s\nPlease choose one of the suggested dates or cancel the booking.",
                                therapistName != null ? therapistName : "your therapist",
                                declineReason != null && !declineReason.isBlank() ? " Reason: " + declineReason : "") 
                                + "\n\nSuggested alternatives:" + altText, "/dashboard/patient?tab=appointments&bookingId=" + booking.getBookingId());
            }
            
            // Email patient: declined with alternatives
            if (patientEmail != null && !patientEmail.isBlank()) {
                try {
                    emailService.sendRescheduleDeclinedWithAlternativesEmail(patientEmail, patientName,
                            booking.getBookingType() != null ? booking.getBookingType().toString() : "Therapy",
                            booking.getDate().toString(), booking.getTime().toString(),
                            therapistName, declineReason,
                            altSlot1Date, altSlot1Time, altSlot2Date, altSlot2Time, altSlot3Date, altSlot3Time);
                } catch (Exception e) {
                    System.err.println("Failed to send reschedule declined email: " + e.getMessage());
                }
            }
        }
        
        Booking saved = bookingRepository.save(booking);
        
        // Broadcast for current date
        Long therapistId = saved.getAssignedTo() != null ? saved.getAssignedTo().getId() : null;
        bookingWebSocketHandler.broadcastBookingUpdate(therapistId, saved.getDate().toString());
        
        return mapToBookingResponse(saved);
    }

    @Override
    @org.springframework.transaction.annotation.Transactional
    public BookingResponse acceptAlternativeSlot(Long id, int slotNumber) {
        Booking booking = bookingRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Booking not found with id: " + id));
        
        if (!booking.isAltSlotsPending()) {
            throw new IllegalStateException("No alternative slots pending for this booking.");
        }
        
        java.time.LocalDate chosenDate;
        java.time.LocalTime chosenTime;
        
        switch (slotNumber) {
            case 1:
                chosenDate = booking.getAltSlot1Date();
                chosenTime = booking.getAltSlot1Time();
                break;
            case 2:
                chosenDate = booking.getAltSlot2Date();
                chosenTime = booking.getAltSlot2Time();
                break;
            case 3:
                chosenDate = booking.getAltSlot3Date();
                chosenTime = booking.getAltSlot3Time();
                break;
            default:
                throw new IllegalStateException("Invalid slot number. Must be 1, 2, or 3.");
        }
        
        if (chosenDate == null || chosenTime == null) {
            throw new IllegalStateException("Selected alternative slot is not available.");
        }
        
        String oldDateStr = booking.getDate().toString();
        booking.setDate(chosenDate);
        booking.setTime(chosenTime);
        booking.setBookingStatus(BookingStatus.CONFIRMED);
        
        // Clear all reschedule & alt fields
        clearRescheduleFields(booking);
        
        Booking saved = bookingRepository.save(booking);
        
        // Notify therapist that patient accepted an alternative
        String patientName = saved.getPatient() != null ? saved.getPatient().getFullName() : saved.getPatientName();
        if (saved.getAssignedTo() != null) {
            notificationService.createNotification(saved.getAssignedTo(), "Alternative Slot Accepted ✅",
                    String.format("Patient %s has accepted the alternative slot on %s at %s for their %s booking.",
                            patientName, chosenDate, chosenTime, saved.getBookingType()), "/dashboard/therapist?bookingId=" + saved.getBookingId());
        }
        
        // Notify patient confirmation
        if (saved.getPatient() != null) {
            notificationService.createNotification(saved.getPatient(), "Booking Rescheduled ✅",
                    String.format("Your %s booking has been rescheduled to %s at %s.",
                            saved.getBookingType(), chosenDate, chosenTime), "/dashboard/patient?tab=appointments&bookingId=" + saved.getBookingId());
        }
        
        // Broadcast WebSocket for old and new dates
        Long therapistId = saved.getAssignedTo() != null ? saved.getAssignedTo().getId() : null;
        bookingWebSocketHandler.broadcastBookingUpdate(therapistId, oldDateStr);
        bookingWebSocketHandler.broadcastBookingUpdate(therapistId, saved.getDate().toString());
        
        return mapToBookingResponse(saved);
    }

    private void clearRescheduleFields(Booking booking) {
        booking.setRescheduleRequested(false);
        booking.setProposedDate(null);
        booking.setProposedTime(null);
        booking.setRescheduleReason(null);
        booking.setAltSlotsPending(false);
        booking.setDeclineReason(null);
        booking.setAltSlot1Date(null);
        booking.setAltSlot1Time(null);
        booking.setAltSlot2Date(null);
        booking.setAltSlot2Time(null);
        booking.setAltSlot3Date(null);
        booking.setAltSlot3Time(null);
    }

    @Override
    @org.springframework.transaction.annotation.Transactional
    public BookingResponse cancelBooking(Long id) {
        Booking booking = bookingRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Booking not found with id: " + id));
        
        validateEligibility(booking, "cancel");
        
        booking.setBookingStatus(BookingStatus.CANCELLED);
        
        // Clear all reschedule & alt slot fields
        clearRescheduleFields(booking);
        
        Booking saved = bookingRepository.save(booking);
        
        // Create in-app notifications for Patient & Therapist
        try {
            String patientName = saved.getPatient() != null ? saved.getPatient().getFullName() : (saved.getPatientName() != null ? saved.getPatientName() : "Patient");
            String typeName = saved.getBookingType() != null ? saved.getBookingType().toString() : "Therapy Session";
            String dateStr = saved.getDate() != null ? saved.getDate().toString() : "";
            String timeStr = saved.getTime() != null ? saved.getTime().toString() : "";

            if (saved.getPatient() != null) {
                String patientMsg = String.format("Your %s booking for %s at %s has been cancelled.", typeName, dateStr, timeStr);
                notificationService.createNotification(saved.getPatient(), "Booking Cancelled ❌", patientMsg, "/dashboard/patient?tab=appointments&bookingId=" + saved.getBookingId());
            }

            if (saved.getAssignedTo() != null) {
                String therapistMsg = String.format("The %s session with patient %s scheduled on %s at %s has been cancelled.", typeName, patientName, dateStr, timeStr);
                notificationService.createNotification(saved.getAssignedTo(), "Booking Cancelled ❌", therapistMsg, "/dashboard/therapist?bookingId=" + saved.getBookingId());
            }
        } catch (Exception e) {
            System.err.println("Failed to create cancellation in-app notifications: " + e.getMessage());
        }

        // Broadcast WebSocket update
        Long therapistId = saved.getAssignedTo() != null ? saved.getAssignedTo().getId() : null;
        bookingWebSocketHandler.broadcastBookingUpdate(therapistId, saved.getDate().toString());
        
        return mapToBookingResponse(saved);
    }

    private java.time.LocalTime resolveAvailableTimeSlotForDate(Long therapistId, java.time.LocalDate date, java.time.LocalTime preferredTime) {
        if (therapistId == null || preferredTime == null) return preferredTime;

        boolean isPreferredTaken = bookingRepository.findByAssignedTo_Id(therapistId).stream()
                .anyMatch(b -> b.getDate() != null && b.getDate().equals(date) && b.getTime() != null && b.getTime().equals(preferredTime) && b.getBookingStatus() != BookingStatus.CANCELLED);

        if (!isPreferredTaken) {
            return preferredTime;
        }

        java.time.LocalTime[] standardSlots = new java.time.LocalTime[]{
            java.time.LocalTime.of(9, 0),
            java.time.LocalTime.of(10, 0),
            java.time.LocalTime.of(11, 0),
            java.time.LocalTime.of(12, 0),
            java.time.LocalTime.of(14, 0),
            java.time.LocalTime.of(15, 0),
            java.time.LocalTime.of(16, 0),
            java.time.LocalTime.of(17, 0)
        };

        java.util.Set<java.time.LocalTime> bookedTimes = bookingRepository.findByAssignedTo_Id(therapistId).stream()
                .filter(b -> b.getDate() != null && b.getDate().equals(date) && b.getTime() != null && b.getBookingStatus() != BookingStatus.CANCELLED)
                .map(Booking::getTime)
                .collect(Collectors.toSet());

        for (java.time.LocalTime slot : standardSlots) {
            if (slot.isAfter(preferredTime) && !bookedTimes.contains(slot)) {
                return slot;
            }
        }

        for (java.time.LocalTime slot : standardSlots) {
            if (!bookedTimes.contains(slot)) {
                return slot;
            }
        }

        return preferredTime;
    }

    private int getDayGapForFrequency(String frequency) {
        if (frequency == null) return 2;
        switch (frequency.toUpperCase()) {
            case "SINGLE_SESSION": return 0;
            case "ONCE_DAILY": return 1;
            case "ALTERNATE_DAYS": return 2;
            case "EVERY_3_DAYS": return 3;
            case "WEEKLY": return 7;
            default: return 2;
        }
    }

    /**
     * Capped round-robin therapist picker:
     * - MAX_SESSIONS_PER_DAY (2) cap per therapist per target date.
     * - Step 1: Among therapists with < cap sessions today, pick the one with the fewest sessions today.
     * - Step 2 (all at/above cap): Fall back to the therapist with the fewest sessions today (round-robin continues).
     * - Tie-break at both steps: fewest total bookings overall (ID as final tie-break for determinism).
     * Returns null if no therapists are registered.
     */
    private static final int MAX_SESSIONS_PER_DAY = 2;

    private User pickLeastLoadedTherapist(java.time.LocalDate targetDate) {
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