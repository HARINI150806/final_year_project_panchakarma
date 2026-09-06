package com.panchakarma.management.controller;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

@RestController
@RequestMapping("/api/ayurveda-ai")
public class AyurvedaAiController {

    private final RestTemplate restTemplate;

    @Value("${rag.service.url:http://localhost:8000/api/chat}")
    private String ragServiceUrl;

    public AyurvedaAiController() {
        this.restTemplate = new RestTemplate();
    }

    @PostMapping("/chat")
    public ResponseEntity<Map<String, Object>> chatWithAyurvedaRAG(@RequestBody Map<String, String> body) {
        String question = body.getOrDefault("question", body.getOrDefault("message", ""));
        if (question == null || question.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Question cannot be empty."));
        }

        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            Map<String, String> ragPayload = Map.of("question", question);
            HttpEntity<Map<String, String>> requestEntity = new HttpEntity<>(ragPayload, headers);

            ResponseEntity<Map> response = restTemplate.postForEntity(ragServiceUrl, requestEntity, Map.class);

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                Object answerObj = response.getBody().get("answer");
                String answer = (answerObj != null) ? answerObj.toString() : "No answer returned from Ayurveda RAG service.";
                return ResponseEntity.ok(Map.of("answer", answer, "response", answer));
            } else {
                return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                        .body(Map.of("answer", "I couldn't find this information in the Ayurveda knowledge base.", "response", "I couldn't find this information in the Ayurveda knowledge base."));
            }
        } catch (Exception e) {
            return ResponseEntity.ok(Map.of(
                    "answer", "I couldn't find this information in the Ayurveda knowledge base. (RAG service offline: " + e.getMessage() + ")",
                    "response", "I couldn't find this information in the Ayurveda knowledge base."
            ));
        }
    }
}
