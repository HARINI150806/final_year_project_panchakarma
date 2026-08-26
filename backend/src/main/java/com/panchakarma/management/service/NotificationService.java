package com.panchakarma.management.service;

import com.panchakarma.management.dto.NotificationResponse;
import com.panchakarma.management.model.Notification;
import com.panchakarma.management.model.User;
import com.panchakarma.management.repository.NotificationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class NotificationService {

    @Autowired
    private NotificationRepository notificationRepository;

    @Transactional
    public void createNotification(User user, String title, String message) {
        createNotification(user, title, message, null);
    }

    @Transactional
    public void createNotification(User user, String title, String message, String targetUrl) {
        // Respect the user's in-app notification preference
        if (user != null && !user.isInAppNotifEnabled()) {
            return;
        }
        Notification notification = new Notification();
        notification.setUser(user);
        notification.setTitle(title);
        notification.setMessage(message);
        notification.setTargetUrl(targetUrl);
        notificationRepository.save(notification);
    }

    public List<NotificationResponse> getNotifications(User user) {
        if (user == null || user.getId() == null) {
            return List.of();
        }
        return notificationRepository.findByUser_IdOrderByCreatedAtDesc(user.getId())
                .stream()
                .map(n -> new NotificationResponse(
                        n.getId(),
                        n.getTitle(),
                        n.getMessage(),
                        n.isRead(),
                        n.getCreatedAt(),
                        n.getTargetUrl()
                ))
                .collect(Collectors.toList());
    }

    @Transactional
    public void markAsRead(Long id) {
        notificationRepository.findById(id).ifPresent(n -> {
            n.setRead(true);
            notificationRepository.save(n);
        });
    }
}
