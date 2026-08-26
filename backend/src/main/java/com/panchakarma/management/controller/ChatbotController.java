package com.panchakarma.management.controller;

import com.panchakarma.management.model.Booking;
import com.panchakarma.management.model.User;
import com.panchakarma.management.repository.BookingRepository;
import com.panchakarma.management.repository.UserRepository;
import com.panchakarma.management.service.GeminiService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/chatbot")
public class ChatbotController {

    private final GeminiService geminiService;
    private final UserRepository userRepository;
    private final BookingRepository bookingRepository;

    public ChatbotController(GeminiService geminiService, UserRepository userRepository, BookingRepository bookingRepository) {
        this.geminiService = geminiService;
        this.userRepository = userRepository;
        this.bookingRepository = bookingRepository;
    }

    @PostMapping("/ask")
    public ResponseEntity<Map<String, String>> askQuestion(@RequestBody Map<String, String> body) {
        String message = body.getOrDefault("message", "");
        if (message.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("response", "Message cannot be empty."));
        }

        var auth = SecurityContextHolder.getContext().getAuthentication();
        String email = auth.getName();
        User user = userRepository.findByEmail(email).orElse(null);
        String dosha = (user != null && user.getDominantDosha() != null) ? user.getDominantDosha() : "Not Assessed";

        // Fetch user's bookings and format as context
        String bookingsContext = "";
        if (user != null) {
            List<Booking> bookings = bookingRepository.findByPatient_Id(user.getId());
            StringBuilder sb = new StringBuilder();
            sb.append("PATIENT BOOKINGS:\n");
            if (bookings.isEmpty()) {
                sb.append("- No bookings found.\n");
            } else {
                for (Booking b : bookings) {
                    sb.append("- ID: ").append(b.getBookingId())
                      .append(", Date: ").append(b.getDate())
                      .append(", Time: ").append(b.getTime())
                      .append(", Type: ").append(b.getBookingType())
                      .append(", Status: ").append(b.getBookingStatus())
                      .append(", Mode: ").append(b.getConsultationType());
                    if (b.getTherapistName() != null) {
                        sb.append(", Therapist: ").append(b.getTherapistName());
                    }
                    if (b.getTherapyName() != null) {
                        sb.append(", Therapy: ").append(b.getTherapyName());
                    }
                    sb.append("\n");
                }
            }
            bookingsContext = sb.toString();
        }

        String reply = geminiService.askWellnessQuestion(message, dosha, bookingsContext);
        return ResponseEntity.ok(Map.of("response", reply));
    }
}
