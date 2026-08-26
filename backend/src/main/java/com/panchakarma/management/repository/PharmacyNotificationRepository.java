package com.panchakarma.management.repository;

import com.panchakarma.management.model.PharmacyNotification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PharmacyNotificationRepository extends JpaRepository<PharmacyNotification, Long> {
    List<PharmacyNotification> findAllByOrderByCreatedAtDesc();
    List<PharmacyNotification> findByReadStatusFalseOrderByCreatedAtDesc();
    long countByReadStatusFalse();
}
