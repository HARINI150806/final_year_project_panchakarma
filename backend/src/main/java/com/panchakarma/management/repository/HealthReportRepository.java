package com.panchakarma.management.repository;

import com.panchakarma.management.model.HealthReport;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface HealthReportRepository extends JpaRepository<HealthReport, Long> {
    List<HealthReport> findByPatientIdOrderByCreatedAtDesc(Long patientId);
}
