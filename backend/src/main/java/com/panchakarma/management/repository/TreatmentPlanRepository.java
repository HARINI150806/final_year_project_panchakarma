package com.panchakarma.management.repository;

import com.panchakarma.management.model.TreatmentPlan;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TreatmentPlanRepository extends JpaRepository<TreatmentPlan, Long> {
    List<TreatmentPlan> findByPatient_Id(Long patientId);
    List<TreatmentPlan> findByPrescribedBy_Id(Long doctorId);
    List<TreatmentPlan> findByAssignedTherapist_Id(Long therapistId);
    List<TreatmentPlan> findByStatus(String status);
}
