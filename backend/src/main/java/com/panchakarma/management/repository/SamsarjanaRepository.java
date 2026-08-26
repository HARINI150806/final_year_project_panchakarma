package com.panchakarma.management.repository;

import com.panchakarma.management.model.SamsarjanaPlan;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SamsarjanaRepository extends JpaRepository<SamsarjanaPlan, Long> {
    List<SamsarjanaPlan> findByPatientIdOrderByCreatedAtDesc(Long patientId);
    Optional<SamsarjanaPlan> findFirstByPatientIdAndStatus(Long patientId, String status);
}
