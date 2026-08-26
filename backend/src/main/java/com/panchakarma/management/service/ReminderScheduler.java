package com.panchakarma.management.service;

import com.panchakarma.management.model.Booking;
import com.panchakarma.management.model.BookingStatus;
import com.panchakarma.management.repository.BookingRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.util.List;

@Component
public class ReminderScheduler {

    private static final Logger log = LoggerFactory.getLogger(ReminderScheduler.class);

    private final BookingRepository bookingRepository;
    private final EmailService emailService;
    private final FollowUpService followUpService;

    public ReminderScheduler(BookingRepository bookingRepository, EmailService emailService, FollowUpService followUpService) {
        this.bookingRepository = bookingRepository;
        this.emailService = emailService;
        this.followUpService = followUpService;
    }

    // Runs every day at 9:10 AM
    @Scheduled(cron = "0 10 9 * * *")
    public void scheduledSendReminders() {
        log.info("Running scheduled booking and follow-up reminder check at 9:10 AM...");
        sendBookingReminders();
        followUpService.sendFollowUpRemindersForTomorrow();
    }

    public void sendBookingReminders() {
        LocalDate today = LocalDate.now();
        LocalDate tomorrow = today.plusDays(1);
        log.info("Checking bookings scheduled for today ({}) or tomorrow ({}) to send reminders...", today, tomorrow);

        List<Booking> bookingsToday = bookingRepository.findByDateAndReminderSentFalse(today);
        List<Booking> bookingsTomorrow = bookingRepository.findByDateAndReminderSentFalse(tomorrow);

        List<Booking> targetBookings = new java.util.ArrayList<>(bookingsToday);
        targetBookings.addAll(bookingsTomorrow);

        int sentCount = 0;

        for (Booking booking : targetBookings) {
            // Only send reminder if the booking is not cancelled
            if (booking.getBookingStatus() != BookingStatus.CANCELLED) {
                String patientEmail = booking.getPatientEmail();
                if (patientEmail == null && booking.getPatient() != null) {
                    patientEmail = booking.getPatient().getEmail();
                }

                if (patientEmail != null) {
                    String patientName = booking.getPatient() != null ? booking.getPatient().getFullName() : (booking.getPatientName() != null ? booking.getPatientName() : "Patient");
                    String therapistName = booking.getAssignedTo() != null ? booking.getAssignedTo().getFullName() : booking.getTherapistName();
                    String dominantDosha = booking.getPatient() != null ? booking.getPatient().getDominantDosha() : null;
                    String patientAdvice = booking.getPatientAdvice();

                    emailService.sendBookingReminderEmail(
                            patientEmail,
                            patientName,
                            booking.getDate().toString(),
                            booking.getTime().toString(),
                            booking.getBookingType().toString(),
                            booking.getPurpose(),
                            therapistName,
                            dominantDosha,
                            patientAdvice
                    );
                    
                    booking.setReminderSent(true);
                    bookingRepository.save(booking);
                    sentCount++;
                }
            }
        }

        log.info("Finished reminder check at 9:10 AM. Sent {} reminders.", sentCount);
    }
}
