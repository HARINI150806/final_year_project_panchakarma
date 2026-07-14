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
import com.panchakarma.management.model.User;
import com.panchakarma.management.repository.UserRepository;
import java.time.LocalDate;
import java.time.Period;
import java.util.Collections;
import java.util.Map;
import java.util.stream.Collectors;

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
            return new DoshaAssessmentResponse(patient.getDominantDosha(), "Dosha assessment already completed for this patient.");
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
            patientRepository.save(patient);
            log.info("Dosha assessment skipped for patientId: {} due to empty assessment data.", patientId);
            return new DoshaAssessmentResponse(null, "No assessment data provided.");
        }

        for (Map.Entry<String, String> entry : request.getAssessmentData().entrySet()) {
            String key = entry.getKey().toLowerCase();
            String value = entry.getValue().toLowerCase();

            switch (key) {
                case "appetite":
                    if (value.contains("irregular") || value.contains("variable")) vataScore += 2;
                    else if (value.contains("strong") || value.contains("frequent")) pittaScore += 2;
                    else if (value.contains("moderate") || value.contains("steady")) kaphaScore += 2;
                    break;
                case "bodybuild":
                    if (value.contains("slender") || value.contains("thin")) vataScore += 2;
                    else if (value.contains("medium") || value.contains("athletic")) pittaScore += 2;
                    else if (value.contains("broad") || value.contains("sturdy")) kaphaScore += 2;
                    break;
                case "climatepreference":
                    if (value.contains("cold") || value.contains("dry")) vataScore += 2;
                    else if (value.contains("hot") || value.contains("warm")) pittaScore += 2; // Pitta dislikes heat
                    else if (value.contains("humid") || value.contains("cool")) kaphaScore += 2;
                    break;
                case "digestion":
                    if (value.contains("gas") || value.contains("bloating") || value.contains("irregular")) vataScore += 2;
                    else if (value.contains("acidity") || value.contains("heartburn") || value.contains("sharp")) pittaScore += 2;
                    else if (value.contains("slow") || value.contains("heavy")) kaphaScore += 2;
                    break;
                case "energylevel":
                    if (value.contains("variable") || value.contains("fluctuating")) vataScore += 2;
                    else if (value.contains("active") || value.contains("energetic")) pittaScore += 2;
                    else if (value.contains("calm") || value.contains("steady")) kaphaScore += 2;
                    break;
                case "personality":
                    if (value.contains("anxious") || value.contains("restless")) vataScore += 2;
                    else if (value.contains("ambitious") || value.contains("irritable")) pittaScore += 2;
                    else if (value.contains("calm") || value.contains("patient")) kaphaScore += 2;
                    break;
                case "skintype":
                    if (value.contains("dry") || value.contains("rough")) vataScore += 2;
                    else if (value.contains("oily") || value.contains("sensitive") || value.contains("warm")) pittaScore += 2;
                    else if (value.contains("smooth") || value.contains("cool")) kaphaScore += 2;
                    break;
                case "sleeppattern":
                    if (value.contains("light") || value.contains("disturbed")) vataScore += 2;
                    else if (value.contains("moderate") || value.contains("sound")) pittaScore += 2;
                    else if (value.contains("deep") || value.contains("long")) kaphaScore += 2;
                    break;
                case "stressresponse":
                    if (value.contains("anxious") || value.contains("worried")) vataScore += 2;
                    else if (value.contains("irritated") || value.contains("angry")) pittaScore += 2;
                    else if (value.contains("withdrawn") || value.contains("lethargic")) kaphaScore += 2;
                    break;
                case "walkingstyle":
                    if (value.contains("quick") || value.contains("erratic")) vataScore += 2;
                    else if (value.contains("purposeful") || value.contains("determined")) pittaScore += 2;
                    else if (value.contains("slow") || value.contains("steady")) kaphaScore += 2;
                    break;
                // Add more cases for other assessment questions as needed
            }
        }

        // Determine dominant dosha
        String dominantDosha;
        boolean assessmentSuccessful = true; // Assume successful initially

        if (vataScore == 0 && pittaScore == 0 && kaphaScore == 0) {
            dominantDosha = null; // No dosha determined
            assessmentSuccessful = false;
        } else if (vataScore > pittaScore && vataScore > kaphaScore) {
            dominantDosha = "VATA";
        } else if (pittaScore > vataScore && pittaScore > kaphaScore) {
            dominantDosha = "PITTA";
        } else if (kaphaScore > vataScore && kaphaScore > pittaScore) {
            dominantDosha = "KAPHA";
        } else {
            // Handle ties or no clear dominant dosha, e.g., by defaulting or more complex rules
            dominantDosha = "UNKNOWN";
        }

        // Update patient entity
        patient.setVataScore(vataScore);
        patient.setPittaScore(pittaScore);
        patient.setKaphaScore(kaphaScore);
        patient.setDominantDosha(dominantDosha);
        patient.setDoshaAssessmentCompleted(assessmentSuccessful);
        patient.setDoshaAssessmentDate(assessmentSuccessful ? LocalDate.now() : null);
        patientRepository.save(patient);

        log.info("Dosha assessment completed for patientId: {}. Calculated Dosha: {}", patientId, dominantDosha);
        return new DoshaAssessmentResponse(dominantDosha, "Dosha assessment completed successfully.");
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
        List<String> healthConditions;
        if (patient.getHealthConditions() != null) {
            healthConditions = new java.util.ArrayList<>();
            for (HealthCondition condition : patient.getHealthConditions()) {
                healthConditions.add(condition.getName() + (condition.getSpecification() != null ? " (" + condition.getSpecification() + ")" : ""));
            }
        } else {
            healthConditions = Collections.emptyList();
        }

        List<String> allergies;
        if (patient.getAllergies() != null) {
            allergies = new java.util.ArrayList<>();
            for (Allergy allergy : patient.getAllergies()) {
                allergies.add(allergy.getName() + (allergy.getSpecification() != null ? " (" + allergy.getSpecification() + ")" : ""));
            }
        } else {
            allergies = Collections.emptyList();
        }

        List<String> previousTreatments;
        if (patient.getPreviousTreatments() != null) {
            previousTreatments = new java.util.ArrayList<>();
            for (PreviousTreatment treatment : patient.getPreviousTreatments()) {
                previousTreatments.add(treatment.getName() + (treatment.getSpecification() != null ? " (" + treatment.getSpecification() + ")" : ""));
            }
        } else {
            previousTreatments = Collections.emptyList();
        }

        // Placeholder for recommended therapies - in a real app, this would be dynamic
        List<String> recommendedTherapies = Collections.emptyList();
        if (patient.getDominantDosha() != null) {
            switch (patient.getDominantDosha()) {
                case "VATA":
                    recommendedTherapies = List.of("Abhyanga (Oil Massage)", "Swedana (Herbal Steam)", "Basti (Enema)");
                    break;
                case "PITTA":
                    recommendedTherapies = List.of("Virechana (Purgation)", "Shirodhara (Oil Drip)", "Cooling Therapies");
                    break;
                case "KAPHA":
                    recommendedTherapies = List.of("Vamana (Emesis)", "Udvartana (Dry Powder Massage)", "Stimulating Therapies");
                    break;
                default:
                    recommendedTherapies = Collections.emptyList();
            }
        }


        return new PatientProfileResponse(
                user.getId(),
                user.getFullName(),
                user.getEmail(),
                patient.getContactNumber(),
                user.getRole(),
                age,
                patient.getGender(),
                patient.getHeight() != null ? patient.getHeight().toString() : null,
                patient.getWeight() != null ? patient.getWeight().toString() : null,
                patient.getOccupation(),
                null, // bodyBuild - not in Patient entity yet
                null, // skinType - not in Patient entity yet
                null, // appetite - not in Patient entity yet
                null, // digestion - not in Patient entity yet
                null, // sleepPattern - not in Patient entity yet
                null, // energyLevel - not in Patient entity yet
                null, // stressResponse - not in Patient entity yet
                null, // climatePreference - not in Patient entity yet
                null, // walkingStyle - not in Patient entity yet
                null, // personality - not in Patient entity yet
                patient.getVataScore(),
                patient.getPittaScore(),
                patient.getKaphaScore(),
                patient.getDominantDosha(),
                patient.isDoshaAssessmentCompleted(),
                patient.getDoshaAssessmentDate() != null ? patient.getDoshaAssessmentDate().atStartOfDay() : null,
                recommendedTherapies
        );
    }
}