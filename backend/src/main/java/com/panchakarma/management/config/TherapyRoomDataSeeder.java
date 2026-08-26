package com.panchakarma.management.config;

import com.panchakarma.management.model.TherapyRoom;
import com.panchakarma.management.repository.TherapyRoomRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class TherapyRoomDataSeeder implements CommandLineRunner {

    private final TherapyRoomRepository therapyRoomRepository;

    public TherapyRoomDataSeeder(TherapyRoomRepository therapyRoomRepository) {
        this.therapyRoomRepository = therapyRoomRepository;
    }

    @Override
    public void run(String... args) throws Exception {
        if (therapyRoomRepository.count() == 0) {
            TherapyRoom room1 = new TherapyRoom(null, "Suite 101 - Shirodhara & Abhyanga Droni", "SHIRODHARA_SUITE", "AVAILABLE", null, null, null);
            TherapyRoom room2 = new TherapyRoom(null, "Suite 102 - Swedana Herbal Steam Chamber", "SWEDANA_CHAMBER", "NEEDS_SANITIZATION", "Patient Wellness", "Swedana Steam Therapy", "18:00");
            TherapyRoom room3 = new TherapyRoom(null, "Suite 103 - Basti & Panchakarma Clinic Room", "BASTI_ROOM", "AVAILABLE", null, null, null);
            TherapyRoom room4 = new TherapyRoom(null, "Suite 104 - Nasya & Herbal Care Pavilion", "NASYA_CARE", "AVAILABLE", null, null, null);

            therapyRoomRepository.saveAll(List.of(room1, room2, room3, room4));
        }
    }
}
