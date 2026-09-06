package com.panchakarma.management.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "recovery_prediction")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RecoveryPrediction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "therapy_plan_id", nullable = false)
    private TreatmentPlan treatmentPlan;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "patient_id", nullable = false)
    private User patient;

    @Column(name = "predicted_recovery")
    private Double predictedRecovery;

    @Column(name = "prediction_date", nullable = false)
    private LocalDateTime predictionDate;

    @Column(name = "model_version")
    private String modelVersion; // e.g. "XGBoost-v1.0"

    @Column(name = "status")
    private String status; // "Improving", "Stable", "Needs Attention"

    @PrePersist
    protected void onCreate() {
        if (predictionDate == null) {
            predictionDate = LocalDateTime.now();
        }
    }
}
