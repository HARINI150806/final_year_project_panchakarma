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
            String targetUrl = apiUrl != null && !apiUrl.isBlank()
                    ? apiUrl
                    : "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent";

            if (targetUrl.contains("gemini-2.5-flash")) {
                targetUrl = targetUrl.replace("gemini-2.5-flash", "gemini-1.5-flash");
            }

            String urlWithKey = targetUrl + "?key=" + apiKey;
            ResponseEntity<String> response = restTemplate.postForEntity(urlWithKey, request, String.class);

            if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
                JsonNode root = objectMapper.readTree(response.getBody());
                JsonNode candidateText = root.path("candidates").get(0).path("content").path("parts").get(0).path("text");
                if (!candidateText.isMissingNode() && !candidateText.asText().isBlank()) {
                    return candidateText.asText();
                }
            }
        } catch (Exception e) {
            log.error("Gemini Chatbot API call failed for URL {}: {}", apiUrl, e.getMessage());
        }

        return getAyurvedicFallbackAnswer(message, userDosha);
    }

    private String getAyurvedicFallbackAnswer(String message, String userDosha) {
        String query = message != null ? message.toLowerCase() : "";
        
        if (query.contains("panchakarma")) {
            return "🌿 **Panchakarma (Five Purification Therapies)**\n\n" +
                   "Panchakarma is the ultimate Ayurvedic detox and rejuvenation program designed to cleanse accumulated toxins (Ama) from deep tissues and restore Vata, Pitta, and Kapha balance.\n\n" +
                   "**The 5 Purification Procedures:**\n" +
                   "1. **Vamana**: Therapeutic emesis for Kapha detoxification.\n" +
                   "2. **Virechana**: Herbal purgation for Pitta purification.\n" +
                   "3. **Basti**: Medicated oil/herbal enema for Vata balancing.\n" +
                   "4. **Nasya**: Nasal administration of herbal oils for respiratory & sinus health.\n" +
                   "5. **Raktamokshana**: Blood purification for pitta-skin disorders.\n\n" +
                   "*Note: Please consult your attending Vaidya for personalized therapy scheduling.*";
        } else if (query.contains("abhyanga")) {
            return "💆‍♂️ **Abhyanga (Ayurvedic Herbal Oil Massage)**\n\n" +
                   "Abhyanga is a synchronized full-body massage using warm, herb-infused oils tailored to your Dosha (such as Mahanarayana or Dhanwantharam oil).\n\n" +
                   "**Key Benefits:**\n" +
                   "• Pacifies Vata dosha, alleviates joint stiffness & muscle strain.\n" +
                   "• Enhances blood & lymphatic circulation, boosting vitality.\n" +
                   "• Promotes deep relaxation, restful sleep, and skin nourishment.\n\n" +
                   "*Post-Care Tip: Follow with a warm herbal bath or steam (Swedana).*";
        } else if (query.contains("shirodhara")) {
            return "💧 **Shirodhara (Therapeutic Oil Pouring)**\n\n" +
                   "Shirodhara involves pouring a continuous, gentle stream of warm medicated oil across the third eye and forehead.\n\n" +
                   "**Key Benefits:**\n" +
                   "• Calms the central nervous system, relieving stress, anxiety & insomnia.\n" +
                   "• Improves mental clarity, memory, and headache relief.\n" +
                   "• Balances sub-doshas of Vata (Prana) and Pitta (Sadhaka).";
        } else if (query.contains("vata")) {
            return "🌬️ **Vata Dosha Care & Guidelines**\n\n" +
                   "Vata represents Air & Ether elements (governing movement, nervous system, and digestion).\n\n" +
                   "**Balancing Recommendations:**\n" +
                   "• Diet: Favor warm, cooked, nourishing foods with ghee and mild spices.\n" +
                   "• Avoid: Raw cold salads, iced drinks, dry snacks, and irregular sleeping times.\n" +
                   "• Lifestyle: Keep a warm, grounding daily routine (Dinacharya).";
        } else if (query.contains("pitta")) {
            return "🔥 **Pitta Dosha Care & Guidelines**\n\n" +
                   "Pitta represents Fire & Water elements (governing metabolism, digestion, and body temperature).\n\n" +
                   "**Balancing Recommendations:**\n" +
                   "• Diet: Favor cooling, sweet, bitter, and astringent foods (coconut, sweet fruits, green vegetables).\n" +
                   "• Avoid: Excessively spicy, salty, sour, fried foods, and hot direct sun.\n" +
                   "• Lifestyle: Stay hydrated with cool herbal infusions and practice meditation.";
        } else if (query.contains("kapha")) {
            return "🌊 **Kapha Dosha Care & Guidelines**\n\n" +
                   "Kapha represents Earth & Water elements (governing body structure, lubrication, and immunity).\n\n" +
                   "**Balancing Recommendations:**\n" +
                   "• Diet: Favor light, warm, dry, and spicy foods (ginger, mung dal, steamed leafy greens).\n" +
                   "• Avoid: Heavy dairy, cold sweets, oily fried foods, and daytime napping.\n" +
                   "• Lifestyle: Engage in active morning exercise and invigorating therapies.";
        } else if (query.contains("diet") || query.contains("pathya") || query.contains("food")) {
            return "🥗 **Ayurvedic Diet Guidelines (Pathya & Apathya)**\n\n" +
                   "**Recommended Intake (Pathya):**\n" +
                   "• Freshly cooked Kitchari (rice and mung dal soup) with a touch of ghee.\n" +
                   "• Warm herbal teas (cumin, coriander, fennel, ginger).\n" +
                   "• Steamed seasonal vegetables and well-cooked grains.\n\n" +
                   "**Things to Avoid (Apathya):**\n" +
                   "• Iced beverages, processed foods, heavy fried meals, and late-night dinners.";
        } else {
            return "🌿 **Ayurvedic Health & Wellness Guidance**\n\n" +
                   "Welcome to PanchAI Wellness Center! Ayurveda emphasizes maintaining health by balancing the three Doshas (Vata, Pitta, Kapha) through customized diet, daily routine (Dinacharya), and Panchakarma detox therapies.\n\n" +
                   "You can ask me about:\n" +
                   "• Panchakarma therapies (Abhyanga, Shirodhara, Virechana, Basti)\n" +
                   "• Dosha balancing tips (Vata, Pitta, Kapha guidelines)\n" +
                   "• Diet & Pathya recommendations\n\n" +
                   "*Note: For clinical diagnosis or treatment changes, please consult your Vaidya.*";
        }
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
