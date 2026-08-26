package com.panchakarma.management.repository;

import com.panchakarma.management.model.TherapistWeeklySchedule;
import com.panchakarma.management.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.DayOfWeek;
import java.util.List;
import java.util.Optional;

@Repository
public interface TherapistWeeklyScheduleRepository extends JpaRepository<TherapistWeeklySchedule, Long> {
    List<TherapistWeeklySchedule> findByTherapist(User therapist);
    Optional<TherapistWeeklySchedule> findByTherapistAndDayOfWeek(User therapist, DayOfWeek dayOfWeek);
}
