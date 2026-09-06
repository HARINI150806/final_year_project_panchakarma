package com.panchakarma.management.controller;

import com.panchakarma.management.dto.DashboardStatsResponse;
import com.panchakarma.management.model.UserRole;
import com.panchakarma.management.repository.BookingRepository;
import com.panchakarma.management.repository.TherapyRoomRepository;
import com.panchakarma.management.repository.UserRepository;
import com.panchakarma.management.service.DashboardService;
import java.security.Principal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
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

        List<Map<String, Object>> therapistList = userRepository.findByRole(UserRole.THERAPIST).stream()
                .map(t -> {
                    Map<String, Object> map = new HashMap<>();
                    map.put("id", t.getId());
                    map.put("name", t.getFullName());
                    map.put("isSenior", t.isSeniorTherapist());
                    return map;
                })
                .collect(Collectors.toList());

        Map<String, Object> response = new HashMap<>();
        response.put("registeredPatients", patientCount);
        response.put("activeTherapists", therapistCount);
        response.put("activePharmacists", pharmacistCount);
        response.put("totalBookings", bookingCount);
        response.put("availableRooms", roomCount);
        response.put("therapists", therapistList);

        return ResponseEntity.ok(response);
    }
}
