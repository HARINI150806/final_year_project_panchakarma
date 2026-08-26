package com.panchakarma.management.controller;

import com.panchakarma.management.model.TherapyRoom;
import com.panchakarma.management.repository.TherapyRoomRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/rooms")
public class TherapyRoomController {

    @Autowired
    private TherapyRoomRepository therapyRoomRepository;

    @GetMapping
    public ResponseEntity<List<TherapyRoom>> getAllRooms() {
        return ResponseEntity.ok(therapyRoomRepository.findAll());
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<TherapyRoom> updateRoomStatus(
            @PathVariable Long id,
            @RequestBody Map<String, String> payload) {
        TherapyRoom room = therapyRoomRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Room not found with id: " + id));

        String status = payload.getOrDefault("status", "AVAILABLE");
        String currentPatientName = payload.getOrDefault("currentPatientName", null);
        String currentTherapy = payload.getOrDefault("currentTherapy", null);
        String occupiedUntil = payload.getOrDefault("occupiedUntil", null);

        room.setStatus(status);
        if ("AVAILABLE".equals(status)) {
            room.setCurrentPatientName(null);
            room.setCurrentTherapy(null);
            room.setOccupiedUntil(null);
        } else {
            if (currentPatientName != null) room.setCurrentPatientName(currentPatientName);
            if (currentTherapy != null) room.setCurrentTherapy(currentTherapy);
            if (occupiedUntil != null) room.setOccupiedUntil(occupiedUntil);
        }

        return ResponseEntity.ok(therapyRoomRepository.save(room));
    }
}
