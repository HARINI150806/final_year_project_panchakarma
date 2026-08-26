package com.panchakarma.management.repository;

import com.panchakarma.management.model.TherapyRoom;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface TherapyRoomRepository extends JpaRepository<TherapyRoom, Long> {
    Optional<TherapyRoom> findByRoomName(String roomName);
}
