package com.panchakarma.management.repository;

import com.panchakarma.management.model.TherapistAvailability;
import com.panchakarma.management.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface TherapistAvailabilityRepository extends JpaRepository<TherapistAvailability, Long> {
    List<TherapistAvailability> findByTherapist(User therapist);
    List<TherapistAvailability> findByAvailableDateAndIsAvailableTrue(LocalDate date);
    List<TherapistAvailability> findByTherapistAndAvailableDateAndIsAvailableTrue(User therapist, LocalDate date);
    List<TherapistAvailability> findByTherapistAndIsAvailableTrue(User therapist);
}
