package com.panchakarma.management.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "therapy_rooms")
public class TherapyRoom {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "room_name", nullable = false, unique = true)
    private String roomName;

    @Column(name = "room_type", nullable = false)
    private String roomType; // e.g. SHIRODHARA_SUITE, SWEDANA_CHAMBER, BASTI_ROOM, NASYA_CARE

    @Column(name = "status", nullable = false)
    private String status = "AVAILABLE"; // AVAILABLE, OCCUPIED, NEEDS_SANITIZATION

    @Column(name = "current_patient_name")
    private String currentPatientName;

    @Column(name = "current_therapy")
    private String currentTherapy;

    @Column(name = "occupied_until")
    private String occupiedUntil;
}
