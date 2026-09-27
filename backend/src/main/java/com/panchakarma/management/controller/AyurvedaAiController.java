package com.panchakarma.management.controller;

import com.panchakarma.management.service.GeminiService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

@RestController
@RequestMapping("/api/ayurveda-ai")
public class AyurvedaAiController {

    private final RestTemplate restTemplate;
    private final GeminiService geminiService;

    @Value("${rag.service.url:https://panchakarma-rag-service.onrender.com/api/chat}")
    private String ragServiceUrl;

    public AyurvedaAiController(GeminiService geminiService) {
        this.restTemplate = new RestTemplate();
        this.geminiService = geminiService;
    }

    @PostMapping("/chat")
    public ResponseEntity<Map<String, Object>> chatWithAyurvedaRAG(@RequestBody Map<String, String> body) {
        String question = body.getOrDefault("question", body.getOrDefault("message", ""));
        if (question == null || question.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Question cannot be empty."));
        }

        // 1. Attempt call to Python RAG FastAPI service
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            Map<String, String> ragPayload = Map.of("question", question);
            HttpEntity<Map<String, String>> requestEntity = new HttpEntity<>(ragPayload, headers);

            ResponseEntity<Map> response = restTemplate.postForEntity(ragServiceUrl, requestEntity, Map.class);

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                Object answerObj = response.getBody().get("answer");
                String answer = (answerObj != null) ? answerObj.toString() : null;
                if (answer != null && !answer.isBlank()) {
                    return ResponseEntity.ok(Map.of("answer", answer, "response", answer));
                }
            }
        } catch (Exception e) {
            System.err.println("RAG service call failed: " + e.getMessage() + ". Falling back to Gemini AI.");
        }

        // 2. Seamless fallback to Gemini AI Service
        try {
            String geminiAnswer = geminiService.askWellnessQuestion(question, null, "No active bookings context.");
            if (geminiAnswer != null && !geminiAnswer.isBlank()) {
                return ResponseEntity.ok(Map.of("answer", geminiAnswer, "response", geminiAnswer));
            }
        } catch (Exception ex) {
            System.err.println("Gemini AI fallback failed: " + ex.getMessage());
        }

        // 3. Graceful static response fallback
        String fallbackMsg = "Panchakarma is an ancient Ayurvedic purification and rejuvenation procedure comprising 5 main therapies (Vamana, Virechana, Basti, Nasya, Raktamokshana) customized for your specific Dosha balance.";
        return ResponseEntity.ok(Map.of("answer", fallbackMsg, "response", fallbackMsg));
    }
}
