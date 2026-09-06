package com.panchakarma.management.repository;

import com.panchakarma.management.model.RecoveryTracking;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RecoveryTrackingRepository extends JpaRepository<RecoveryTracking, Long> {

    List<RecoveryTracking> findByTreatmentPlanIdOrderBySessionNumberAsc(Long treatmentPlanId);

    Optional<RecoveryTracking> findByTreatmentPlanIdAndSessionNumber(Long treatmentPlanId, Integer sessionNumber);

    List<RecoveryTracking> findByPatientIdOrderByAssessmentDateDesc(Long patientId);

    Optional<RecoveryTracking> findFirstByTreatmentPlanIdOrderBySessionNumberDesc(Long treatmentPlanId);
}
