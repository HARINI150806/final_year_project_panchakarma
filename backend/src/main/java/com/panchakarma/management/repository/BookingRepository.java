package com.panchakarma.management.repository;



import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.panchakarma.management.model.Booking;
import com.panchakarma.management.model.User;

public interface BookingRepository extends JpaRepository<Booking, Long> {
    List<Booking> findByPatient_Id(Long patientId);
    List<Booking> findByPatientEmail(String patientEmail);
    List<Booking> findByAssignedTo(User assignedTo);
    List<Booking> findByAssignedTo_Id(Long assignedToId);
    List<Booking> findByAssignedToAndPatient(User assignedTo, User patient);
    List<Booking> findByAssignedToAndDate(User assignedTo, java.time.LocalDate date);
    List<Booking> findByDateAndReminderSentFalse(java.time.LocalDate date);
    long countByAssignedTo(User assignedTo);
    long countByAssignedToAndDate(User assignedTo, java.time.LocalDate date);
}