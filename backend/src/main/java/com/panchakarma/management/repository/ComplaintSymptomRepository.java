package com.panchakarma.management.repository;

import com.panchakarma.management.model.ComplaintSymptom;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ComplaintSymptomRepository extends JpaRepository<ComplaintSymptom, Long> {
}