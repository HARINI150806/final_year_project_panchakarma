package com.panchakarma.management.repository;

import com.panchakarma.management.model.FollowUp;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface FollowUpRepository extends JpaRepository<FollowUp, Long> {
    List<FollowUp> findByPatientIdOrderByFollowupDateAsc(Long patientId);
    List<FollowUp> findByTherapistIdOrderByFollowupDateAsc(Long therapistId);
    List<FollowUp> findByFollowupDateAndReminderSentFalse(LocalDate followupDate);
}
