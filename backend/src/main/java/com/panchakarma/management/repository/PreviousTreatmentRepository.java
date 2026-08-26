package com.panchakarma.management.repository;

import com.panchakarma.management.model.PreviousTreatment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface PreviousTreatmentRepository extends JpaRepository<PreviousTreatment, Long> {
}