package com.panchakarma.management.model;

import jakarta.persistence.*;
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
@Table(name = "daily_agni_logs")
public class AgniLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "patient_id", nullable = false)
    private User patient;

    @Column(nullable = false)
    private LocalDate logDate;

    @Column(nullable = false)
    private String agniType; // MANDAGNI, TIKSHNAGNI, VISHAMAGNI, SAMAGNI

    private String notes;

    private String weatherTemperature; // COLD, MILD, HOT
    private String weatherHumidity;    // DRY, MODERATE, WET

    @CreationTimestamp
    private LocalDateTime createdAt;
}
