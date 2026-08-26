package com.panchakarma.management.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "followups")
public class FollowUp {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long followupId;

    @ManyToOne
    @JoinColumn(name = "patient_id")
    private User patient;

    @ManyToOne
    @JoinColumn(name = "therapist_id")
    private User therapist;

    @ManyToOne
    @JoinColumn(name = "booking_id")
    private Booking booking;

    @Column(name = "treatment_name")
    private String treatmentName;

    @Column(name = "followup_date", nullable = false)
    private LocalDate followupDate;

    @Column(name = "followup_time")
    private LocalTime followupTime;

    @Column(name = "reason")
    private String reason;

    @Column(name = "status")
    private String status = "UPCOMING"; // UPCOMING, COMPLETED, CANCELLED

    // Observations recorded during consultation
    @Column(name = "pain_level")
    private Integer painLevel;

    @Column(name = "sleep_quality")
    private Integer sleepQuality;

    @Column(name = "energy_level")
    private Integer energyLevel;

    @Column(name = "recovery_status")
    private String recoveryStatus; // Excellent, Good, Moderate, Poor

    @Column(name = "additional_observations", length = 2000)
    private String additionalObservations;

    @Column(name = "continue_medication")
    private Boolean continueMedication;

    @Column(name = "further_therapy_required")
    private Boolean furtherTherapyRequired;

    @Column(name = "reminder_sent", nullable = false, columnDefinition = "boolean default false")
    private boolean reminderSent = false;

    @CreationTimestamp
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;
}
