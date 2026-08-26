package com.panchakarma.management.controller;

import com.panchakarma.management.model.AgniLog;
import com.panchakarma.management.model.User;
import com.panchakarma.management.repository.AgniLogRepository;
import com.panchakarma.management.repository.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.Month;
import java.util.*;

@RestController
@RequestMapping("/api/rutu-rhythm")
public class RutuRhythmController {

    private final UserRepository userRepository;
    private final AgniLogRepository agniLogRepository;

    public RutuRhythmController(UserRepository userRepository, AgniLogRepository agniLogRepository) {
        this.userRepository = userRepository;
        this.agniLogRepository = agniLogRepository;
    }

    private User getAuthenticatedUser() {
        var auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null) return null;
        return userRepository.findByEmail(auth.getName()).orElse(null);
    }

    @GetMapping("/agni-log/today")
    public ResponseEntity<AgniLog> getTodayAgniLog() {
        User user = getAuthenticatedUser();
        if (user == null) {
            return ResponseEntity.status(401).build();
        }
        Optional<AgniLog> log = agniLogRepository.findByPatient_IdAndLogDate(user.getId(), LocalDate.now());
        return log.map(ResponseEntity::ok).orElse(ResponseEntity.noContent().build());
    }

    @PostMapping("/agni-log")
    public ResponseEntity<AgniLog> saveAgniLog(@RequestBody Map<String, String> payload) {
        User user = getAuthenticatedUser();
        if (user == null) {
            return ResponseEntity.status(401).build();
        }

        String agniType = payload.get("agniType");
        String notes = payload.get("notes");
        String weatherTemperature = payload.get("weatherTemperature");
        String weatherHumidity = payload.get("weatherHumidity");

        if (agniType == null || agniType.isBlank()) {
            return ResponseEntity.badRequest().build();
        }

        // Upsert today's log
        AgniLog log = agniLogRepository.findByPatient_IdAndLogDate(user.getId(), LocalDate.now())
                .orElse(new AgniLog());

        log.setPatient(user);
        log.setLogDate(LocalDate.now());
        log.setAgniType(agniType);
        log.setNotes(notes);
        log.setWeatherTemperature(weatherTemperature);
        log.setWeatherHumidity(weatherHumidity);

        AgniLog saved = agniLogRepository.save(log);
        return ResponseEntity.ok(saved);
    }

    @GetMapping("/suggestions")
    public ResponseEntity<Map<String, Object>> getSuggestions(
            @RequestParam(required = false) String temp, // COLD, MILD, HOT
            @RequestParam(required = false) String humidity // DRY, MODERATE, WET
    ) {
        User user = getAuthenticatedUser();
        String dosha = (user != null && user.getDominantDosha() != null) ? user.getDominantDosha().toUpperCase() : "GENERAL";

        int currentMonth = LocalDate.now().getMonthValue();
        Map<String, Object> response = new HashMap<>();

        // 1. Determine Rutu (Season)
        String rutuSanskrit;
        String rutuEnglish;
        String rutuDesc;
        String seasonalPacification;

        if (currentMonth == 3 || currentMonth == 4) {
            rutuSanskrit = "Vasanta";
            rutuEnglish = "Spring";
            rutuDesc = "As spring arrives, the warming sun melts accumulated winter energies. You might feel a bit sluggish or notice some congestion. This is a great time to focus on light, warm, and stimulating foods to refresh your body.";
            seasonalPacification = "Kapha";
        } else if (currentMonth == 5 || currentMonth == 6) {
            rutuSanskrit = "Grishma";
            rutuEnglish = "Summer";
            rutuDesc = "During the hot summer months, heat accumulates in the body and can drain your natural energy. To stay cool and balanced, focus on staying hydrated and enjoying sweet, refreshing, or cooling foods.";
            seasonalPacification = "Pitta";
        } else if (currentMonth == 7 || currentMonth == 8) {
            rutuSanskrit = "Varsha";
            rutuEnglish = "Monsoon/Rainy";
            rutuDesc = "With the damp monsoon rains, your body's digestive power naturally slows down. It's best to stay warm, protect yourself from cold drafts, and stick to freshly cooked, easy-to-digest meals.";
            seasonalPacification = "Vata";
        } else if (currentMonth == 9 || currentMonth == 10) {
            rutuSanskrit = "Sharad";
            rutuEnglish = "Autumn";
            rutuDesc = "In the clear autumn, the sharp sun after rains can create excess heat and irritability. Cultivate calm by enjoying sweet, bitter, and cooling foods, and incorporate pure cow's ghee into your meals.";
            seasonalPacification = "Pitta";
        } else if (currentMonth == 11 || currentMonth == 12) {
            rutuSanskrit = "Hemanta";
            rutuEnglish = "Pre-Winter";
            rutuDesc = "The crisp winter air turns our internal heat inward, making our digestion exceptionally strong. Nourish your body with warm, hearty, and grounding stews to keep your energy high.";
            seasonalPacification = "Vata";
        } else { // 1 or 2
            rutuSanskrit = "Shishira";
            rutuEnglish = "Late Winter/Cold Season";
            rutuDesc = "During the chilly late winter, cold and wind are at their peak. Keep warm, practice dry silk skin massage to boost circulation, and enjoy warm, well-cooked meals.";
            seasonalPacification = "Vata";
        }

        response.put("rutuSanskrit", rutuSanskrit);
        response.put("rutuEnglish", rutuEnglish);
        response.put("rutuDescription", rutuDesc);
        response.put("seasonalPacification", seasonalPacification);

        // 2. Weather override analysis
        String activeTemp = (temp != null && !temp.isBlank()) ? temp.toUpperCase() : "MILD";
        String activeHumidity = (humidity != null && !humidity.isBlank()) ? humidity.toUpperCase() : "MODERATE";

        response.put("temp", activeTemp);
        response.put("humidity", activeHumidity);

        // Compute active Dosha risk
        String climateAlert = "";
        List<String> routineTweak = new ArrayList<>();
        List<String> dietRecommendations = new ArrayList<>();
        Map<String, String> agniHerbs = new HashMap<>();

        // Seed Agni formulations advice
        agniHerbs.put("SAMAGNI", "Your stomach is feeling great and digesting food well. Keep drinking warm water and eat regular healthy meals.");
        agniHerbs.put("MANDAGNI", "Your stomach is feeling slow, heavy, or full. Try drinking warm ginger water or cumin tea before eating to help settle it.");
        agniHerbs.put("TIKSHNAGNI", "Your stomach is feeling too hot, acidic, or burning. Drink cooling fennel tea, fresh aloe vera juice, or cool water. Avoid hot spices and fried food.");
        agniHerbs.put("VISHAMAGNI", "Your stomach is feeling gassy, bloated, or irregular. Drink warm water with a small pinch of ginger or mint to ease the gas.");

        // Dynamic guidelines based on active climate + dominant dosha
        if (activeTemp.equals("HOT")) {
            climateAlert = "It's quite hot today! Stay in the shade, drink plenty of water, and avoid spicy, salty, or fried foods.";
            dietRecommendations.add("Enjoy sweet juicy fruits like watermelon, sweet grapes, and pears.");
            dietRecommendations.add("Drink cool coconut water, cucumber juice, and fresh mint tea.");
            dietRecommendations.add("Avoid deep-fried dishes, hot peppers, garlic, and vinegar.");
            
            if (dosha.contains("PITTA")) {
                climateAlert += " Since your body is sensitive to heat, you might get skin rashes or heartburn easily. Keep yourself cool and relaxed.";
                routineTweak.add("Use cooling coconut or sandalwood oil for your body massage instead of heating sesame oil.");
                routineTweak.add("Do cooling breathing exercises (mouth-hissing breath) for 5 minutes in the morning.");
            } else {
                routineTweak.add("Take cool or lukewarm water baths instead of hot showers.");
            }
        } else if (activeTemp.equals("COLD")) {
            climateAlert = "It is cold outside! Keep yourself warm and eat warm, freshly cooked meals.";
            dietRecommendations.add("Eat warm vegetable soups, stews, and hot grains with butter or ghee.");
            dietRecommendations.add("Sip warm ginger-cinnamon tea during the day.");
            dietRecommendations.add("Avoid ice drinks, raw salads, and cold food from the fridge.");

            if (dosha.contains("VATA")) {
                climateAlert += " Since your body is sensitive to dryness and cold, keep your skin moisturized, stay out of dry wind, and drink warm drinks.";
                routineTweak.add("Massage your body with warm sesame oil and take a warm shower shortly after.");
                routineTweak.add("Turn off screens early and drink warm milk before bed to help you sleep.");
            } else if (dosha.contains("KAPHA")) {
                climateAlert += " Since your body gets heavy and sluggish in the cold, try to keep moving and active.";
                routineTweak.add("Do some active exercises or fast stretching to boost your blood flow and energy.");
                routineTweak.add("Use a dry washcloth or dry brush on your skin instead of massage oil to feel lighter.");
            } else {
                routineTweak.add("Keep your chest and joints warmly covered and take slow deep breaths.");
            }
        } else { // MILD
            climateAlert = "The weather is very pleasant today. Continue your normal daily routine.";
            dietRecommendations.add("Eat fresh seasonal vegetables, whole grains, and simple meals.");
            dietRecommendations.add("Eat your meals at regular times and drink enough water.");
            routineTweak.add("Practice your standard daily stretching and take 10 minutes to sit quietly.");
            routineTweak.add("Massage your body with a simple oil once a week.");
        }

        // Humidity additions
        if (activeHumidity.equals("WET")) {
            climateAlert += " High humidity and dampness can slow down your stomach. Eat light, dry meals with black pepper and ginger.";
            dietRecommendations.add("Add warm spices like black pepper, cumin, and ginger to your food.");
            dietRecommendations.add("Avoid heavy sweets, fried items, and cold milk or cheese.");
            routineTweak.add("Do active deep breathing exercises to clear any stuffiness.");
        } else if (activeHumidity.equals("DRY")) {
            climateAlert += " Dry air can dry out your skin and throat. Drink plenty of warm water and use healthy fats like butter or olive oil.";
            dietRecommendations.add("Include healthy cooking oils or butter in your food and eat warm soups.");
            dietRecommendations.add("Drink warm water or herbal teas throughout the day.");
            routineTweak.add("Apply a small drop of warm oil inside your nose to keep it from drying out.");
        }

        response.put("climateAlert", climateAlert);
        response.put("dietRecommendations", dietRecommendations);
        response.put("routineTweak", routineTweak);
        response.put("agniHerbs", agniHerbs);

        return ResponseEntity.ok(response);
    }
}
