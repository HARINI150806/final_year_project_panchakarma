package com.panchakarma.management.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "treatment_plans")
public class TreatmentPlan {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "patient_id", nullable = false)
    private User patient;

    @ManyToOne
    @JoinColumn(name = "prescribed_by_id")
    private User prescribedBy;

    @ManyToOne
    @JoinColumn(name = "assigned_therapist_id")
    private User assignedTherapist;

    @Column(name = "therapy_name", nullable = false)
    private String therapyName;

    @Column(name = "total_sessions", nullable = false)
    private Integer totalSessions = 1;

    @Column(name = "frequency", nullable = false)
    private String frequency = "ALTERNATE_DAYS"; // ONCE_DAILY, ALTERNATE_DAYS, EVERY_3_DAYS, WEEKLY

    @Column(name = "prescribed_start_date")
    private LocalDate prescribedStartDate;

    @Column(name = "clinical_notes", length = 2000)
    private String clinicalNotes;

    @Column(name = "status", nullable = false)
    private String status = "PLANNED"; // PLANNED, SCHEDULED, IN_PROGRESS, COMPLETED, CANCELLED

    @Column(name = "package_id")
    private String packageId;

    @Column(name = "consultation_booking_id")
    private Long consultationBookingId;

    @CreationTimestamp
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;
}
