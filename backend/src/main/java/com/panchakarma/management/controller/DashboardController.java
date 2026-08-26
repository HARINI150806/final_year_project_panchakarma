package com.panchakarma.management.controller;

import com.panchakarma.management.dto.DashboardStatsResponse;
import com.panchakarma.management.model.UserRole;
import com.panchakarma.management.repository.BookingRepository;
import com.panchakarma.management.repository.TherapyRoomRepository;
import com.panchakarma.management.repository.UserRepository;
import com.panchakarma.management.service.DashboardService;
import java.security.Principal;
import java.util.Map;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
public class DashboardController {

    private final DashboardService dashboardService;
    private final UserRepository userRepository;
    private final BookingRepository bookingRepository;
    private final TherapyRoomRepository therapyRoomRepository;

    public DashboardController(
            DashboardService dashboardService,
            UserRepository userRepository,
            BookingRepository bookingRepository,
            TherapyRoomRepository therapyRoomRepository) {
        this.dashboardService = dashboardService;
        this.userRepository = userRepository;
        this.bookingRepository = bookingRepository;
        this.therapyRoomRepository = therapyRoomRepository;
    }

    @GetMapping("/dashboard")
    public ResponseEntity<DashboardStatsResponse> getDashboard(Principal principal) {
        com.panchakarma.management.model.User user = userRepository.findByEmail(principal.getName()).orElse(null);
        return ResponseEntity.ok(dashboardService.buildDashboard(user));
    }

    @GetMapping("/public/clinic-stats")
    public ResponseEntity<Map<String, Object>> getPublicClinicStats() {
        long patientCount = userRepository.countByRole(UserRole.PATIENT);
        long therapistCount = userRepository.countByRole(UserRole.THERAPIST);
        long pharmacistCount = userRepository.countByRole(UserRole.PHARMACIST);
        long bookingCount = bookingRepository.count();
        long roomCount = therapyRoomRepository.count();

        return ResponseEntity.ok(Map.of(
            "registeredPatients", patientCount,
            "activeTherapists", therapistCount,
            "activePharmacists", pharmacistCount,
            "totalBookings", bookingCount,
            "availableRooms", roomCount
        ));
    }
}
