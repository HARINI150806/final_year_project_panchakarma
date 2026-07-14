package com.panchakarma.management.repository;



import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.panchakarma.management.model.Booking;
import com.panchakarma.management.model.User;

public interface BookingRepository extends JpaRepository<Booking, Long> {
    List<Booking> findByPatient_Id(Long patientId);
    List<Booking> findByAssignedTo(User assignedTo);
}