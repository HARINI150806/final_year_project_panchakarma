package com.panchakarma.management.repository;

import com.panchakarma.management.model.Patient;
import com.panchakarma.management.model.User;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface PatientRepository extends JpaRepository<Patient, Long> {
    Optional<Patient> findByUser(User user);
}