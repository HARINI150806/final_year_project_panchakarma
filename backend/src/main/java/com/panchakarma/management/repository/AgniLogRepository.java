package com.panchakarma.management.repository;

import com.panchakarma.management.model.AgniLog;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface AgniLogRepository extends JpaRepository<AgniLog, Long> {
    List<AgniLog> findByPatient_IdOrderByLogDateDesc(Long patientId);
    Optional<AgniLog> findByPatient_IdAndLogDate(Long patientId, LocalDate logDate);
}
