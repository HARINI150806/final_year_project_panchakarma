package com.panchakarma.management.service.impl;

import com.panchakarma.management.dto.DoshaAssessmentRequest;
import com.panchakarma.management.dto.DoshaAssessmentResponse;
import com.panchakarma.management.exception.ResourceNotFoundException;
import com.panchakarma.management.model.Patient;
import com.panchakarma.management.repository.PatientRepository;
import com.panchakarma.management.service.PatientService;

import com.panchakarma.management.model.HealthCondition;
import com.panchakarma.management.model.Allergy;
import com.panchakarma.management.model.PreviousTreatment;

import org.springframework.transaction.annotation.Transactional;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

import com.panchakarma.management.dto.PatientProfileResponse;
import com.panchakarma.management.dto.PatientProfileResponse.ProfileItemResponse;
import com.panchakarma.management.model.User;
import com.panchakarma.management.repository.UserRepository;
import java.time.LocalDate;
import java.time.Period;
import java.util.Collections;
import java.util.Map;

@Service
public class PatientServiceImpl implements PatientService {

    private static final Logger log = LoggerFactory.getLogger(PatientServiceImpl.class);

    @Autowired
    private PatientRepository patientRepository;

    @Autowired
    private UserRepository userRepository;

    @Override
    public Patient createPatient(Patient patient) {
        return patientRepository.save(patient);
    }

    @Override
    public List<Patient> getAllPatients() {
        return patientRepository.findAll();
    }

    @Override
    public Patient getPatientById(Long id) {
        Optional<Patient> patient = patientRepository.findById(id);
        return patient.orElse(null); // Or throw a custom exception if preferred
    }

    @Override
    public Patient updatePatient(Long id, Patient patient) {
        if (patientRepository.existsById(id)) {
            patient.setId(id);
            return patientRepository.save(patient);
        }
        return null; // Or throw a custom exception if preferred
    }

    @Override
    public void deletePatient(Long id) {
        patientRepository.deleteById(id);
    }

    @Override
    @Transactional
    public DoshaAssessmentResponse performDoshaAssessment(Long patientId, DoshaAssessmentRequest request) {
        log.info("Performing dosha assessment for patientId: {}", patientId);
        log.debug("Received assessment data: {}", request.getAssessmentData());
        Patient patient = patientRepository.findById(patientId)
                .orElseThrow(() -> new ResourceNotFoundException("Patient not found with id: " + patientId));

        if (patient.isDoshaAssessmentCompleted()) {
            log.info("Dosha assessment already completed for patientId: {}. Skipping new assessment.", patientId);
            return buildDoshaResponse(patient, recommendedTherapiesFor(patient.getDominantDosha()),
                    "Dosha assessment already completed for this patient.");
        }

        int vataScore = 0;
        int pittaScore = 0;
        int kaphaScore = 0;

        if (request.getAssessmentData().isEmpty()) {
            patient.setVataScore(0);
            patient.setPittaScore(0);
            patient.setKaphaScore(0);
            patient.setDominantDosha(null);
            patient.setDoshaAssessmentCompleted(false);
            patient.setDoshaAssessmentDate(null);
            syncAssessmentToUser(patient, request, null, 0, 0, 0, false, null);
            patientRepository.save(patient);
            log.info("Dosha assessment skipped for patientId: {} due to empty assessment data.", patientId);
            return buildDoshaResponse(patient, Collections.emptyList(), "No assessment data provided.");
        }

        for (Map.Entry<String, String> entry : request.getAssessmentData().entrySet()) {
            String dosha = doshaForAnswer(entry.getKey(), entry.getValue());
            if ("VATA".equals(dosha)) {
                vataScore += 1;
            } else if ("PITTA".equals(dosha)) {
                pittaScore += 1;
            } else if ("KAPHA".equals(dosha)) {
                kaphaScore += 1;
            }
        }

        // Determine dominant dosha
        String dominantDosha;
        boolean assessmentSuccessful = true; // Assume successful initially

        if (vataScore == 0 && pittaScore == 0 && kaphaScore == 0) {
            dominantDosha = null; // No dosha determined
            assessmentSuccessful = false;
        } else {
            dominantDosha = determineDoshaType(vataScore, pittaScore, kaphaScore);
        }

        // Update patient entity
        patient.setVataScore(vataScore);
        patient.setPittaScore(pittaScore);
        patient.setKaphaScore(kaphaScore);
        patient.setDominantDosha(dominantDosha);
        patient.setDoshaAssessmentCompleted(assessmentSuccessful);
        patient.setDoshaAssessmentDate(assessmentSuccessful ? LocalDate.now() : null);
        syncAssessmentToUser(patient, request, dominantDosha, vataScore, pittaScore, kaphaScore,
                assessmentSuccessful, patient.getDoshaAssessmentDate());
        patientRepository.save(patient);

        log.info("Dosha assessment completed for patientId: {}. Calculated Dosha: {}", patientId, dominantDosha);
        return buildDoshaResponse(patient, recommendedTherapiesFor(dominantDosha),
                "Dosha assessment completed successfully.");
    }

    @Override
    public PatientProfileResponse getPatientProfile(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));

        // Fetch the Patient directly from the repository to ensure it's the most up-to-date
        Patient patient = patientRepository.findById(user.getPatient().getId())
                .orElseThrow(() -> new ResourceNotFoundException("Patient profile not found for user id: " + userId));

        // Calculate age
        Integer age = null;
        if (patient.getDateOfBirth() != null) {
            age = Period.between(patient.getDateOfBirth(), LocalDate.now()).getYears();
        }

        // Map health conditions, allergies, previous treatments to list of strings
        List<ProfileItemResponse> healthConditions;
        if (patient.getHealthConditions() != null) {
            healthConditions = new java.util.ArrayList<>();
            for (HealthCondition condition : patient.getHealthConditions()) {
                healthConditions.add(new ProfileItemResponse(condition.getId(), condition.getName(), condition.getSpecification()));
            }
        } else {
            healthConditions = Collections.emptyList();
        }

        List<ProfileItemResponse> allergies;
        if (patient.getAllergies() != null) {
            allergies = new java.util.ArrayList<>();
            for (Allergy allergy : patient.getAllergies()) {
                allergies.add(new ProfileItemResponse(allergy.getId(), allergy.getName(), allergy.getSpecification()));
            }
        } else {
            allergies = Collections.emptyList();
        }

        List<ProfileItemResponse> previousTreatments;
        if (patient.getPreviousTreatments() != null) {
            previousTreatments = new java.util.ArrayList<>();
            for (PreviousTreatment treatment : patient.getPreviousTreatments()) {
                previousTreatments.add(new ProfileItemResponse(treatment.getId(), treatment.getName(), treatment.getSpecification()));
            }
        } else {
            previousTreatments = Collections.emptyList();
        }

        List<String> recommendedTherapies = recommendedTherapiesFor(patient.getDominantDosha());


        return new PatientProfileResponse(
                patient.getId(),
                user.getId(),
                patient.getFirstName(),
                patient.getLastName(),
                user.getFullName(),
                user.getEmail(),
                patient.getContactNumber(),
                user.getRole(),
                patient.getDateOfBirth(),
                age,
                patient.getGender(),
                patient.getHeight() != null ? patient.getHeight().toString() : null,
                patient.getWeight() != null ? patient.getWeight().toString() : null,
                patient.getOccupation(),
                patient.isProfileCompleted(),
                healthConditions,
                allergies,
                previousTreatments,
                user.getBodyBuild(),
                user.getSkinType(),
                user.getAppetite(),
                user.getDigestion(),
                user.getSleepPattern(),
                user.getEnergyLevel(),
                user.getStressResponse(),
                user.getClimatePreference(),
                user.getWalkingStyle(),
                user.getPersonality(),
                patient.getVataScore(),
                patient.getPittaScore(),
                patient.getKaphaScore(),
                patient.getDominantDosha(),
                patient.isDoshaAssessmentCompleted(),
                patient.getDoshaAssessmentDate() != null ? patient.getDoshaAssessmentDate().atStartOfDay() : null,
                recommendedTherapies
        );
    }

    private void syncAssessmentToUser(Patient patient, DoshaAssessmentRequest request, String dominantDosha,
                                      Integer vataScore, Integer pittaScore, Integer kaphaScore,
                                      boolean assessmentCompleted, LocalDate assessmentDate) {
        User user = patient.getUser();
        if (user == null) {
            return;
        }

        Map<String, String> data = request.getAssessmentData();
        user.setBodyBuild(value(data, "bodyBuild"));
        user.setSkinType(value(data, "skinType"));
        user.setAppetite(value(data, "appetite"));
        user.setDigestion(value(data, "digestion"));
        user.setSleepPattern(value(data, "sleepPattern"));
        user.setEnergyLevel(value(data, "energyLevel"));
        user.setStressResponse(value(data, "stressResponse"));
        user.setClimatePreference(value(data, "climatePreference"));
        user.setWalkingStyle(value(data, "walkingStyle"));
        user.setPersonality(value(data, "personality"));
        user.setVataScore(vataScore);
        user.setPittaScore(pittaScore);
        user.setKaphaScore(kaphaScore);
        user.setDominantDosha(dominantDosha);
        user.setDoshaAssessmentCompleted(assessmentCompleted);
        user.setDoshaAssessmentDate(assessmentDate != null ? assessmentDate.atStartOfDay() : null);

        String gender = value(data, "gender");
        if (gender != null) {
            user.setGender(gender);
            patient.setGender(gender);
        }
        String fullName = value(data, "fullName");
        if (fullName != null) {
            user.setFullName(fullName);
            String[] nameParts = fullName.trim().split("\\s+", 2);
            patient.setFirstName(nameParts.length > 0 ? nameParts[0] : "");
            patient.setLastName(nameParts.length > 1 ? nameParts[1] : "");
        }
        String height = value(data, "height");
        user.setHeight(height);
        Double heightValue = parseDouble(height, "height");
        if (heightValue != null) {
            patient.setHeight(heightValue);
        }
        String weight = value(data, "weight");
        user.setWeight(weight);
        Double weightValue = parseDouble(weight, "weight");
        if (weightValue != null) {
            patient.setWeight(weightValue);
        }
        String occupation = value(data, "occupation");
        if (occupation != null) {
            user.setOccupation(occupation);
            patient.setOccupation(occupation);
        }
        String age = value(data, "age");
        if (age != null) {
            try {
                user.setAge(Integer.valueOf(age));
            } catch (NumberFormatException ignored) {
                log.debug("Ignoring non-numeric age value in dosha assessment: {}", age);
            }
        }

        userRepository.save(user);
    }

    private String value(Map<String, String> data, String key) {
        return data.entrySet().stream()
                .filter(entry -> entry.getKey().equalsIgnoreCase(key))
                .map(Map.Entry::getValue)
                .findFirst()
                .orElse(null);
    }

    private Double parseDouble(String value, String fieldName) {
        if (value == null || value.isBlank()) {
            return null;
        }
        try {
            return Double.valueOf(value);
        } catch (NumberFormatException ignored) {
            log.debug("Ignoring non-numeric {} value in dosha assessment: {}", fieldName, value);
            return null;
        }
    }

    private String doshaForAnswer(String key, String value) {
        if (key == null || value == null) {
            return null;
        }

        String normalizedKey = key.toLowerCase();
        String normalizedValue = value.trim().toLowerCase();

        return switch (normalizedKey) {
            case "bodybuild" -> switch (normalizedValue) {
                case "thin and lean" -> "VATA";
                case "medium and athletic" -> "PITTA";
                case "broad and sturdy" -> "KAPHA";
                default -> null;
            };
            case "skintype" -> switch (normalizedValue) {
                case "dry and rough" -> "VATA";
                case "warm and sensitive" -> "PITTA";
                case "soft and oily" -> "KAPHA";
                default -> null;
            };
            case "appetite" -> switch (normalizedValue) {
                case "irregular" -> "VATA";
                case "strong and frequent" -> "PITTA";
                case "moderate and steady" -> "KAPHA";
                default -> null;
            };
            case "digestion" -> switch (normalizedValue) {
                case "gas or bloating" -> "VATA";
                case "acidity or heartburn" -> "PITTA";
                case "slow digestion" -> "KAPHA";
                default -> null;
            };
            case "sleeppattern" -> switch (normalizedValue) {
                case "light and interrupted" -> "VATA";
                case "moderate" -> "PITTA";
                case "deep and long" -> "KAPHA";
                default -> null;
            };
            case "energylevel" -> switch (normalizedValue) {
                case "variable" -> "VATA";
                case "active and energetic" -> "PITTA";
                case "calm and steady" -> "KAPHA";
                default -> null;
            };
            case "stressresponse" -> switch (normalizedValue) {
                case "anxious or worried" -> "VATA";
                case "irritated or angry" -> "PITTA";
                case "calm or withdrawn" -> "KAPHA";
                default -> null;
            };
            case "climatepreference" -> switch (normalizedValue) {
                case "warm" -> "VATA";
                case "cool" -> "PITTA";
                case "dry or moderate" -> "KAPHA";
                default -> null;
            };
            case "walkingstyle" -> switch (normalizedValue) {
                case "fast" -> "VATA";
                case "moderate" -> "PITTA";
                case "slow and steady" -> "KAPHA";
                default -> null;
            };
            case "personality" -> switch (normalizedValue) {
                case "creative and enthusiastic" -> "VATA";
                case "confident and ambitious" -> "PITTA";
                case "calm and patient" -> "KAPHA";
                default -> null;
            };
            default -> null;
        };
    }

    private String determineDoshaType(int vataScore, int pittaScore, int kaphaScore) {
        int maxScore = Math.max(vataScore, Math.max(pittaScore, kaphaScore));
        boolean vataDominant = vataScore == maxScore;
        boolean pittaDominant = pittaScore == maxScore;
        boolean kaphaDominant = kaphaScore == maxScore;

        if (vataDominant && pittaDominant && kaphaDominant) {
            return "TRIDOSHA";
        }
        if (vataDominant && pittaDominant) {
            return "VATA_PITTA";
        }
        if (vataDominant && kaphaDominant) {
            return "VATA_KAPHA";
        }
        if (pittaDominant && kaphaDominant) {
            return "PITTA_KAPHA";
        }
        if (vataDominant) {
            return "VATA";
        }
        if (pittaDominant) {
            return "PITTA";
        }
        return "KAPHA";
    }

    private DoshaAssessmentResponse buildDoshaResponse(Patient patient, List<String> recommendedTherapies,
                                                       String message) {
        return new DoshaAssessmentResponse(
                patient.getDominantDosha(),
                patient.getDominantDosha(),
                patient.getVataScore(),
                patient.getPittaScore(),
                patient.getKaphaScore(),
                patient.isDoshaAssessmentCompleted(),
                patient.getDoshaAssessmentDate() != null ? patient.getDoshaAssessmentDate().atStartOfDay() : null,
                recommendedTherapies,
                message
        );
    }

    private List<String> recommendedTherapiesFor(String dominantDosha) {
        if (dominantDosha == null) {
            return Collections.emptyList();
        }
        return switch (dominantDosha) {
            case "VATA" -> List.of("Abhyanga (Oil Massage)", "Swedana (Herbal Steam)", "Basti (Enema)");
            case "PITTA" -> List.of("Virechana (Purgation)", "Shirodhara (Oil Drip)", "Cooling Therapies");
            case "KAPHA" -> List.of("Vamana (Emesis)", "Udvartana (Dry Powder Massage)", "Stimulating Therapies");
            case "VATA_PITTA" -> List.of("Abhyanga (Oil Massage)", "Shirodhara (Oil Drip)", "Cooling Therapies");
            case "VATA_KAPHA" -> List.of("Abhyanga (Oil Massage)", "Udvartana (Dry Powder Massage)", "Basti (Enema)");
            case "PITTA_KAPHA" -> List.of("Virechana (Purgation)", "Udvartana (Dry Powder Massage)", "Shirodhara (Oil Drip)");
            case "TRIDOSHA" -> List.of("Abhyanga (Oil Massage)", "Shirodhara (Oil Drip)", "Balanced Diet Consultation");
            default -> Collections.emptyList();
        };
    }
}
