package com.panchakarma.management.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

@Service
public class GeminiService {

    private static final Logger log = LoggerFactory.getLogger(GeminiService.class);

    @Value("${gemini.api-key:}")
    private String apiKey;

    @Value("${gemini.api-url}")
    private String apiUrl;

    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    /**
     * Ask an Ayurvedic wellness question to Gemini.
     *
     * @param message         The user's query
     * @param userDosha       The user's dominant Dosha
     * @param bookingsContext Context list of user's active/past bookings
     * @return                AI wellness guidance reply
     */
    public String askWellnessQuestion(String message, String userDosha, String bookingsContext) {
        if (apiKey == null || apiKey.isBlank()) {
            return "Hello! I am AyurBot, your AI Ayurvedic Wellness Assistant. I can see your dominant Dosha is " + 
                   (userDosha != null ? userDosha : "Not Assessed yet") + ". " +
                   "I am currently in demo mode (Gemini API key is not configured), but when active, " +
                   "I will answer all your wellness questions and provide tailored Ayurvedic lifestyle and diet advice. " +
                   "For example, you asked: \"" + message + "\"";
        }

        java.time.LocalDateTime now = java.time.LocalDateTime.now();
        String currentDateTimeStr = now.format(java.time.format.DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"));

        String systemPrompt = "You are a professional Ayurvedic Wellness Assistant named AyurBot. " +
                "Your role is to guide the user on Ayurvedic lifestyles (Dinacharya), diet, home remedies, " +
                "and explain the benefits and preparation for traditional Panchakarma therapies (such as Shirodhara, Abhyanga, Basti, etc.).\n" +
                "Today's Date and Time is: " + currentDateTimeStr + ".\n" +
                "The user's dominant Dosha is: " + (userDosha != null && !userDosha.isEmpty() ? userDosha : "Not Assessed yet") + ".\n" +
                "Below is the list of appointments/bookings the user currently has in our clinic. If they ask about their appointments, schedule, dates, times, or status, use this database context to answer accurately:\n" +
                bookingsContext + "\n" +
                "GUIDELINES FOR ANSWERING BOOKING ENQUIRIES:\n" +
                "- Prioritize and focus on upcoming/future appointments (status CONFIRMED or PENDING with dates after or equal to today).\n" +
                "- Do NOT tell the user about completed or cancelled appointments (status COMPLETED, CANCELLED, or dates in the past) unless they explicitly ask for their past history or treatment summary.\n" +
                "Keep your answers concise, clear, and encouraging. Structure them nicely with paragraphs or bullet points.\n" +
                "IMPORTANT: Add a short, friendly medical disclaimer at the very end reminding the user to consult their therapist or doctor for any diagnostic or clinical decisions.";

        String fullPrompt = systemPrompt + "\n\nUser Question: " + message;

        String requestBody = """
            {
              "contents": [{
                "parts": [{
                  "text": "%s"
                }]
              }],
              "generationConfig": {
                "temperature": 0.7
              }
            }
            """.formatted(escapeJson(fullPrompt));

        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            HttpEntity<String> request = new HttpEntity<>(requestBody, headers);
            String urlWithKey = apiUrl + "?key=" + apiKey;

            ResponseEntity<String> response = restTemplate.postForEntity(urlWithKey, request, String.class);

            if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
                JsonNode root = objectMapper.readTree(response.getBody());
                return root
                        .path("candidates").get(0)
                        .path("content")
                        .path("parts").get(0)
                        .path("text").asText();
            }
        } catch (Exception e) {
            log.error("Gemini Chatbot API call failed: {}", e.getMessage());
        }

        return "I apologize, but I encountered an error while processing your request. Please try again or consult your doctor.";
    }

    private String escapeJson(String text) {
        return text
                .replace("\\", "\\\\")
                .replace("\"", "\\\"")
                .replace("\n", "\\n")
                .replace("\r", "\\r")
                .replace("\t", "\\t");
    }
}
