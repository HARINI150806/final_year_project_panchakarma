package com.panchakarma.management.repository;

import com.panchakarma.management.model.RecoveryPrediction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RecoveryPredictionRepository extends JpaRepository<RecoveryPrediction, Long> {

    Optional<RecoveryPrediction> findFirstByTreatmentPlanIdOrderByPredictionDateDesc(Long treatmentPlanId);

    List<RecoveryPrediction> findByPatientIdOrderByPredictionDateDesc(Long patientId);
}
