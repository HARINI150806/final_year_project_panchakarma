package com.panchakarma.management.controller;

import com.panchakarma.management.service.ReminderScheduler;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/bookings")
public class BookingReminderController {

    private final ReminderScheduler reminderScheduler;

    public BookingReminderController(ReminderScheduler reminderScheduler) {
        this.reminderScheduler = reminderScheduler;
    }

    @GetMapping("/trigger-reminders")
    public ResponseEntity<String> triggerReminders() {
        reminderScheduler.sendBookingReminders();
        return ResponseEntity.ok("Reminders check triggered successfully!");
    }
}
