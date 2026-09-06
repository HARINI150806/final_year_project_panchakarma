package com.panchakarma.management.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "recovery_tracking")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RecoveryTracking {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "therapy_plan_id", nullable = false)
    private TreatmentPlan treatmentPlan;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "patient_id", nullable = false)
    private User patient;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "therapist_id")
    private User therapist;

    @Column(name = "session_number", nullable = false)
    private Integer sessionNumber; // 0 = Baseline, 1..N = Session

    @Column(name = "pain_level")
    private Integer painLevel; // 0 - 10

    @Column(name = "sleep_quality")
    private Integer sleepQuality; // 0 - 10

    @Column(name = "energy_level")
    private Integer energyLevel; // 0 - 10

    @Column(name = "overall_condition")
    private Integer overallCondition; // 0 - 10

    @Column(name = "clinical_observation", columnDefinition = "TEXT")
    private String clinicalObservation;

    @Column(name = "therapist_remarks", columnDefinition = "TEXT")
    private String therapistRemarks;

    @Column(name = "current_recovery_percentage")
    private Double currentRecoveryPercentage;

    @Column(name = "assessment_date", nullable = false)
    private LocalDateTime assessmentDate;

    @PrePersist
    protected void onCreate() {
        if (assessmentDate == null) {
            assessmentDate = LocalDateTime.now();
        }
    }
}
