package com.panchakarma.management.repository;

import com.panchakarma.management.model.Notification;
import com.panchakarma.management.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {
    List<Notification> findByUserOrderByCreatedAtDesc(User user);
    List<Notification> findByUser_IdOrderByCreatedAtDesc(Long userId);
}
