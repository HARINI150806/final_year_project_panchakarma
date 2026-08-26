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
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "samsarjana_plans")
public class SamsarjanaPlan {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "patient_id", nullable = false)
    private Long patientId;

    @Column(name = "patient_name")
    private String patientName;

    @Column(name = "therapy_name")
    private String therapyName;

    @Column(name = "total_days", nullable = false)
    private Integer totalDays = 5;

    @Column(name = "current_day", nullable = false)
    private Integer currentDay = 1;

    @Column(name = "start_date", nullable = false)
    private LocalDate startDate;

    @Column(name = "status", nullable = false)
    private String status = "ACTIVE"; // ACTIVE, COMPLETED

    @Column(name = "assigned_by_doctor_name")
    private String assignedByDoctorName = "Dr. Vaidya";

    @CreationTimestamp
    private LocalDateTime createdAt;
}
