package com.panchakarma.management.repository;

import com.panchakarma.management.model.TherapistDateOverride;
import com.panchakarma.management.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface TherapistDateOverrideRepository extends JpaRepository<TherapistDateOverride, Long> {
    List<TherapistDateOverride> findByTherapist(User therapist);
    Optional<TherapistDateOverride> findByTherapistAndOverrideDate(User therapist, LocalDate date);
    List<TherapistDateOverride> findByTherapistAndOverrideDateAfter(User therapist, LocalDate date);
}
