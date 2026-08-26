package com.panchakarma.management.service;

import com.panchakarma.management.dto.DashboardStatsResponse;
import com.panchakarma.management.model.Booking;
import com.panchakarma.management.model.BookingStatus;
import com.panchakarma.management.model.User;
import com.panchakarma.management.model.UserRole;
import com.panchakarma.management.repository.BookingRepository;
import com.panchakarma.management.repository.NotificationRepository;
import com.panchakarma.management.repository.TherapyRoomRepository;
import com.panchakarma.management.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class DashboardService {

        @Autowired
        private BookingRepository bookingRepository;

        @Autowired
        private UserRepository userRepository;

        @Autowired
        private TherapyRoomRepository therapyRoomRepository;

        @Autowired
        private NotificationRepository notificationRepository;

        @Autowired
        private PharmacyService pharmacyService;

        public DashboardStatsResponse buildDashboard(UserRole role) {
                return buildDashboard(null, role);
        }

        public DashboardStatsResponse buildDashboard(User user) {
                UserRole role = user != null ? user.getRole() : UserRole.PATIENT;
                return buildDashboard(user, role);
        }

        public DashboardStatsResponse buildDashboard(User user, UserRole role) {
                UserRole activeRole = role != null ? role : (user != null ? user.getRole() : UserRole.PATIENT);

                List<Map<String, Object>> stats = switch (activeRole) {
                        case ADMIN -> buildAdminStats();
                        case THERAPIST -> buildTherapistStats(user);
                        case PATIENT -> buildPatientStats(user);
                        case PHARMACIST -> buildPharmacistStats();
                };

                List<Map<String, Object>> activities = buildActivities(user);

                List<Map<String, Object>> modules = switch (activeRole) {
                        case ADMIN -> List.of(
                                        module("Manage care team", "Onboard, edit, and assign staff"),
                                        module("Manage therapists", "Track schedules and availability"),
                                        module("Manage therapy rooms", "Allocate rooms automatically"),
                                        module("Recovery reports", "View trends and feedback"));
                        case THERAPIST -> List.of(
                                        module("Assigned therapies", "See today's therapy list"),
                                        module("Session updates", "Record pain, sleep, and energy"),
                                        module("Patient history", "Review previous therapy notes"),
                                        module("Completion tracking", "Mark sessions completed"));
                        case PATIENT -> List.of(
                                        module("Book consultation", "Schedule care visits"),
                                        module("Book therapy", "Auto-assign therapist and room"),
                                        module("Track recovery", "View charts and progress bars"),
                                        module("Feedback", "Rate therapies and care quality"));
                        case PHARMACIST -> List.of(
                                        module("Inventory Management", "Manage stock and batch levels"),
                                        module("Dispense Prescriptions", "Fulfill patient prescriptions"),
                                        module("Medicines Catalog", "Browse classical formulations"),
                                        module("Supplier Management", "Track vendor orders and reorders"));
                };

                return new DashboardStatsResponse(stats, activities, modules);
        }

        private List<Map<String, Object>> buildTherapistStats(User therapist) {
                LocalDate today = LocalDate.now();
                List<Booking> allAssigned = (therapist != null) ? bookingRepository.findByAssignedTo(therapist)
                                : List.of();
                if (allAssigned == null)
                        allAssigned = List.of();

                // 1. Assigned Sessions (Total assigned to this therapist)
                long totalAssigned = allAssigned.size();
                long pendingOrRequested = allAssigned.stream()
                                .filter(b -> b != null && (b.isRescheduleRequested()
                                                || b.getBookingStatus() == BookingStatus.PENDING))
                                .count();
                String assignedSub = pendingOrRequested > 0 ? pendingOrRequested + " pending/requested"
                                : "All up to date";

                // 2. Completed Today (Assigned today and completed or date passed)
                List<Booking> todayBookings = allAssigned.stream()
                                .filter(b -> b != null && b.getDate() != null && b.getDate().equals(today))
                                .collect(Collectors.toList());
                long todayCount = todayBookings.size();
                long completedToday = todayBookings.stream()
                                .filter(b -> b.getBookingStatus() == BookingStatus.COMPLETED || isPastTime(b))
                                .count();
                long remainingToday = Math.max(0, todayCount - completedToday);
                String completedSub = todayCount > 0 ? remainingToday + " remaining today"
                                : "No sessions scheduled today";

                // 3. Room Utilization
                long totalRooms = therapyRoomRepository.count();
                if (totalRooms == 0)
                        totalRooms = 6;
                long roomsBookedToday = todayBookings.stream()
                                .filter(b -> b.getBookingStatus() != BookingStatus.CANCELLED).count();
                int utilPct = (int) Math.min(100, Math.round((roomsBookedToday * 100.0) / totalRooms));
                String roomSub = "Across " + totalRooms + " rooms (" + roomsBookedToday + " booked today)";

                // 4. Patient Updates (Reschedule requests + pending alt slots)
                long actionItems = allAssigned.stream()
                                .filter(b -> b != null && (b.isRescheduleRequested() || b.isAltSlotsPending()))
                                .count();
                String updatesSub = actionItems > 0 ? "Need review" : "All clear";

                return List.of(
                                stat("Assigned Sessions", String.valueOf(totalAssigned), assignedSub),
                                stat("Completed Today", String.valueOf(completedToday), completedSub),
                                stat("Room Utilization", utilPct + "%", roomSub),
                                stat("Patient Updates", String.valueOf(actionItems), updatesSub));
        }

        private List<Map<String, Object>> buildAdminStats() {
                LocalDate today = LocalDate.now();
                long totalPatients = userRepository.findByRole(UserRole.PATIENT).size();
                long totalTherapists = userRepository.findByRole(UserRole.THERAPIST).size();
                List<Booking> allBookings = bookingRepository.findAll();
                long todayAppointments = allBookings.stream()
                                .filter(b -> b != null && b.getDate() != null && b.getDate().equals(today)).count();
                long pendingAppointments = allBookings.stream()
                                .filter(b -> b != null && b.getBookingStatus() == BookingStatus.PENDING).count();

                return List.of(
                                stat("Total Patients", String.valueOf(totalPatients), "Registered patients"),
                                stat("Therapists", String.valueOf(totalTherapists), "On duty care staff"),
                                stat("Today's Appointments", String.valueOf(todayAppointments), "Scheduled for today"),
                                stat("Pending Confirmation", String.valueOf(pendingAppointments),
                                                "Awaiting therapist response"));
        }

        private List<Map<String, Object>> buildPatientStats(User patient) {
                if (patient == null || patient.getId() == null) {
                        return List.of(
                                        stat("Upcoming Appointments", "0", "No upcoming bookings"),
                                        stat("Therapy Sessions", "0", "Treatment plan progress"),
                                        stat("Recovery Score", "85%", "Optimal recovery"),
                                        stat("Notifications", "0", "No unread alerts"));
                }
                List<Booking> patientBookings = bookingRepository.findByPatient_Id(patient.getId());
                if (patientBookings == null)
                        patientBookings = List.of();

                long upcoming = patientBookings.stream()
                                .filter(b -> b != null && (b.getBookingStatus() == BookingStatus.CONFIRMED
                                                || b.getBookingStatus() == BookingStatus.PENDING))
                                .count();
                long completed = patientBookings.stream()
                                .filter(b -> b != null
                                                && (b.getBookingStatus() == BookingStatus.COMPLETED || isPastTime(b)))
                                .count();
                long total = patientBookings.size();
                long unreadNotifs = notificationRepository.findByUserOrderByCreatedAtDesc(patient).stream()
                                .filter(n -> n != null && !n.isRead())
                                .count();

                return List.of(
                                stat("Upcoming Appointments", String.valueOf(upcoming), "Scheduled sessions"),
                                stat("Therapy Sessions", completed + "/" + Math.max(completed, total),
                                                "Treatment plan progress"),
                                stat("Recovery Score", "85%", "Improving steadily"),
                                stat("Notifications", String.valueOf(unreadNotifs),
                                                unreadNotifs > 0 ? unreadNotifs + " unread" : "All read"));
        }

        private List<Map<String, Object>> buildActivities(User user) {
                if (user == null || user.getId() == null)
                        return List.of();
                List<Booking> userBookings = (user.getRole() == UserRole.THERAPIST)
                                ? bookingRepository.findByAssignedTo(user)
                                : bookingRepository.findByPatient_Id(user.getId());

                if (userBookings == null)
                        userBookings = List.of();

                List<Map<String, Object>> activities = new ArrayList<>();
                userBookings.stream().filter(b -> b != null).limit(4).forEach(b -> {
                        String title = (b.getBookingType() != null ? b.getBookingType().toString() : "Session") +
                                        " — " + (b.getPurpose() != null ? b.getPurpose() : "Panchakarma");
                        String time = (b.getDate() != null ? b.getDate().toString() : "") +
                                        (b.getTime() != null ? " at " + b.getTime().toString() : "");
                        activities.add(Map.of("title", title, "time", time));
                });

                if (activities.isEmpty()) {
                        activities.add(Map.of("title", "Account active & ready for bookings", "time", "Today"));
                }
                return activities;
        }

        private boolean isPastTime(Booking b) {
                if (b == null || b.getDate() == null || b.getTime() == null)
                        return false;
                try {
                        LocalDateTime bdt = b.getDate().atTime(b.getTime());
                        return LocalDateTime.now().isAfter(bdt);
                } catch (Exception e) {
                        return false;
                }
        }

        private List<Map<String, Object>> buildPharmacistStats() {
                Map<String, Object> pStats = (pharmacyService != null) ? pharmacyService.getDashboardStats() : Map.of();
                long totalMeds = pStats.get("totalMedicines") != null ? ((Number) pStats.get("totalMedicines")).longValue() : 0L;
                long lowStock = pStats.get("lowStockCount") != null ? ((Number) pStats.get("lowStockCount")).longValue() : 0L;
                long outOfStock = pStats.get("outOfStockCount") != null ? ((Number) pStats.get("outOfStockCount")).longValue() : 0L;
                long expiringSoon = pStats.get("expiringSoonCount") != null ? ((Number) pStats.get("expiringSoonCount")).longValue() : 0L;
                long todayDispensed = pStats.get("todayDispensed") != null ? ((Number) pStats.get("todayDispensed")).longValue() : 0L;
                double val = pStats.get("inventoryValue") != null ? ((Number) pStats.get("inventoryValue")).doubleValue() : 0.0;

                String formattedVal = (val >= 100000) ? String.format("₹%.1fL", val / 100000.0) : String.format("₹%,.0f", val);

                return List.of(
                                stat("Total Medicines", String.valueOf(totalMeds), "Active catalog items"),
                                stat("Low Stock", String.valueOf(lowStock), "Require stock reorder"),
                                stat("Out of Stock", String.valueOf(outOfStock), "Critical stock level"),
                                stat("Expiring Soon", String.valueOf(expiringSoon), "Within 30 days"),
                                stat("Today's Dispensed", String.valueOf(todayDispensed), "Prescriptions fulfilled"),
                                stat("Inventory Value", formattedVal, "Current stock valuation"));
        }

        private Map<String, Object> stat(String title, String value, String subtitle) {
                return Map.of("title", title, "value", value, "subtitle", subtitle);
        }

        private Map<String, Object> module(String title, String description) {
                return Map.of("title", title, "description", description);
        }
}
