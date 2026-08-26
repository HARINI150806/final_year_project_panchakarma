package com.panchakarma.management.service;

import com.panchakarma.management.dto.GoogleMeetRequest;
import com.panchakarma.management.dto.GoogleMeetResponse;
import com.panchakarma.management.dto.AvailableSlotResponse;
import com.panchakarma.management.model.*;
import com.panchakarma.management.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class AvailabilityService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private TherapistWeeklyScheduleRepository weeklyScheduleRepository;

    @Autowired
    private TherapistDateOverrideRepository dateOverrideRepository;

    @Autowired
    private BookingRepository bookingRepository;

    @Autowired
    private GoogleMeetService googleMeetService;

    /**
     * Finds the first available therapist slot for a given date
     */
    public AvailableSlotResponse findAvailableSlot(LocalDate preferredDate, String patientEmail) {
        List<User> therapists = userRepository.findByRole(UserRole.THERAPIST);

        for (User therapist : therapists) {
            List<LocalTime[]> workingSlots = getTherapistWorkingSlotsForDate(therapist, preferredDate);
            if (workingSlots.isEmpty()) {
                continue;
            }

            // Get booked slots for this therapist on this date
            List<LocalTime> bookedTimes = bookingRepository
                    .findByAssignedToAndDate(therapist, preferredDate)
                    .stream()
                    .filter(booking -> booking.getBookingStatus() != BookingStatus.CANCELLED)
                    .map(Booking::getTime)
                    .collect(Collectors.toList());

            for (LocalTime[] slotRange : workingSlots) {
                LocalTime slotStart = slotRange[0];
                LocalTime slotEnd = slotRange[1];

                // Check if already booked
                if (bookedTimes.contains(slotStart)) {
                    continue;
                }

                // Schedule Google Meet
                LocalDateTime startDateTime = preferredDate.atTime(slotStart);
                LocalDateTime endDateTime = preferredDate.atTime(slotEnd);

                GoogleMeetRequest meetRequest = new GoogleMeetRequest(
                    "Panchakarma Consultation with " + therapist.getFullName(),
                    startDateTime,
                    endDateTime,
                    patientEmail,
                    therapist.getEmail()
                );

                GoogleMeetResponse meetResponse = googleMeetService.scheduleMeeting(meetRequest);

                return new AvailableSlotResponse(
                    therapist.getId(),
                    therapist.getFullName(),
                    preferredDate,
                    slotStart,
                    slotEnd,
                    meetResponse.meetLink()
                );
            }
        }

        throw new RuntimeException("No available slots on " + preferredDate);
    }

    /**
     * Helper to get all generated 30-min working slots for a therapist on a date,
     * taking overrides, weekly schedule, and lunch breaks into account.
     */
    public List<LocalTime[]> getTherapistWorkingSlotsForDate(User therapist, LocalDate date) {
        List<LocalTime[]> slots = new ArrayList<>();
        LocalTime startTime = null;
        LocalTime endTime = null;
        boolean isAvailable = false;

        // 1. Check Date Override
        Optional<TherapistDateOverride> overrideOpt = dateOverrideRepository
                .findByTherapistAndOverrideDate(therapist, date);

        if (overrideOpt.isPresent()) {
            TherapistDateOverride override = overrideOpt.get();
            isAvailable = override.getIsAvailable();
            if (isAvailable) {
                startTime = override.getStartTime();
                endTime = override.getEndTime();
            }
        } else {
            // 2. Check Weekly Schedule
            DayOfWeek dayOfWeek = date.getDayOfWeek();
            Optional<TherapistWeeklySchedule> scheduleOpt = weeklyScheduleRepository
                    .findByTherapistAndDayOfWeek(therapist, dayOfWeek);

            if (scheduleOpt.isPresent()) {
                TherapistWeeklySchedule schedule = scheduleOpt.get();
                isAvailable = schedule.getIsAvailable();
                if (isAvailable) {
                    startTime = schedule.getStartTime();
                    endTime = schedule.getEndTime();
                }
            } else {
                // Default working schedule if no custom schedule is set in DB: Mon-Sat 09:00 - 17:00, Sun off
                if (dayOfWeek != DayOfWeek.SUNDAY) {
                    isAvailable = true;
                    startTime = LocalTime.of(9, 0);
                    endTime = LocalTime.of(17, 0);
                }
            }
        }

        if (!isAvailable || startTime == null || endTime == null) {
            return slots; // Empty list meaning unavailable
        }

        // 3. Generate 45-minute intervals
        LocalTime current = startTime;
        while (current.plusMinutes(45).isBefore(endTime) || current.plusMinutes(45).equals(endTime)) {
            LocalTime next = current.plusMinutes(45);
            
            // Skip lunch slots starting at 12:30 or 12:45
            boolean isLunch = (current.getHour() == 12 && (current.getMinute() == 30 || current.getMinute() == 45));
            if (!isLunch) {
                slots.add(new LocalTime[]{current, next});
            }
            current = next;
        }

        return slots;
    }

    /**
     * Finds next available slot starting from today or a given date
     */
    public AvailableSlotResponse findNextAvailableSlot(String patientEmail) {
        LocalDate startDate = LocalDate.now();
        
        for (int i = 0; i < 30; i++) { // Check next 30 days
            LocalDate checkDate = startDate.plusDays(i);
            try {
                return findAvailableSlot(checkDate, patientEmail);
            } catch (RuntimeException e) {
                // Continue to next day
            }
        }

        throw new RuntimeException("No available slots in the next 30 days");
    }

    /**
     * Marks a slot as booked/unavailable (legacy/stub method to avoid breaking anything)
     */
    public void markSlotAsBooked(Long slotId) {
        // Dynamic slots are filtered out on-the-fly when saved to Bookings table.
        // This is a stub to preserve compilation if referenced elsewhere.
    }

    /**
     * Gets all dynamic available slots for a specific therapist for the next 30 days
     */
    public List<TherapistAvailability> getTherapistAvailability(Long therapistId) {
        User therapist = userRepository.findById(therapistId)
                .orElseThrow(() -> new RuntimeException("Therapist not found"));

        List<TherapistAvailability> result = new ArrayList<>();
        LocalDate today = LocalDate.now();

        for (int i = 0; i < 30; i++) {
            LocalDate date = today.plusDays(i);
            List<LocalTime[]> workingSlots = getTherapistWorkingSlotsForDate(therapist, date);
            if (workingSlots.isEmpty()) {
                continue;
            }

            // Get booked slots for this therapist on this date
            List<LocalTime> bookedTimes = bookingRepository
                    .findByAssignedToAndDate(therapist, date)
                    .stream()
                    .filter(booking -> booking.getBookingStatus() != BookingStatus.CANCELLED)
                    .map(Booking::getTime)
                    .collect(Collectors.toList());

            for (LocalTime[] slotRange : workingSlots) {
                LocalTime slotStart = slotRange[0];
                LocalTime slotEnd = slotRange[1];

                if (!bookedTimes.contains(slotStart)) {
                    if (date.equals(LocalDate.now()) && slotStart.isBefore(LocalTime.now(java.time.ZoneId.systemDefault()))) {
                        continue; // Skip past slots today
                    }
                    TherapistAvailability slot = new TherapistAvailability();
                    slot.setTherapist(therapist);
                    slot.setAvailableDate(date);
                    slot.setStartTime(slotStart);
                    slot.setEndTime(slotEnd);
                    slot.setIsAvailable(true);
                    result.add(slot);
                }
            }
        }

        return result;
    }

    /**
     * Gets aggregated available slots across all therapists on a specific date
     */
    public List<TherapistAvailability> getAllTherapistsAvailabilityOnDate(LocalDate date) {
        List<User> therapists = userRepository.findByRole(UserRole.THERAPIST);
        List<TherapistAvailability> aggregated = new ArrayList<>();
        java.util.Set<LocalTime> addedStartTimes = new java.util.HashSet<>();

        for (User therapist : therapists) {
            List<TherapistAvailability> therapistSlots = getTherapistAvailability(therapist.getId())
                    .stream()
                    .filter(slot -> slot.getAvailableDate().equals(date))
                    .collect(Collectors.toList());

            for (TherapistAvailability slot : therapistSlots) {
                if (addedStartTimes.add(slot.getStartTime())) {
                    aggregated.add(slot);
                }
            }
        }

        aggregated.sort(java.util.Comparator.comparing(TherapistAvailability::getStartTime));
        return aggregated;
    }

    /**
     * Legacy method for manual slots creation (no longer needed, kept as empty stub to avoid compilation errors)
     */
    public void createTherapistSlots(Long therapistId, LocalDate startDate, LocalDate endDate) {
    }
}
