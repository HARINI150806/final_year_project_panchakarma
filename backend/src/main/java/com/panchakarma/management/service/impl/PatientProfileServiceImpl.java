package com.panchakarma.management.service.impl;

import com.panchakarma.management.dto.PatientProfileRequest;
import com.panchakarma.management.exception.ResourceNotFoundException;
import com.panchakarma.management.model.*;
import com.panchakarma.management.repository.*;
import com.panchakarma.management.service.PatientProfileService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Service
public class PatientProfileServiceImpl implements PatientProfileService {

    private static final Logger log = LoggerFactory.getLogger(PatientProfileServiceImpl.class);

    @Autowired
    private PatientRepository patientRepository;

    @Autowired
    private HealthConditionRepository healthConditionRepository;

    @Autowired
    private AllergyRepository allergyRepository;

    @Autowired
    private PreviousTreatmentRepository previousTreatmentRepository;

    @Override
    @Transactional
    public void updatePatientProfile(Long patientId, PatientProfileRequest request) {
        log.info("Attempting to update patient profile for patientId: {}", patientId);
        Patient patient = patientRepository.findById(patientId)
                .orElseThrow(() -> {
                    log.warn("Patient not found with id: {}", patientId);
                    return new ResourceNotFoundException("Patient not found with id: " + patientId);
                });
        log.info("Patient found with id: {}", patientId);

        patient.setDateOfBirth(request.getDateOfBirth());
        patient.setGender(request.getGender());
        patient.setHeight(request.getHeight());
        patient.setWeight(request.getWeight());
        patient.setOccupation(request.getOccupation());

        // Clear existing collections
        patient.getHealthConditions().clear();
        patient.getAllergies().clear();
        patient.getPreviousTreatments().clear();

        // Update health conditions
        if (request.getExistingHealthConditions() != null) {
            for (String conditionName : request.getExistingHealthConditions()) {
                HealthCondition healthCondition = new HealthCondition();
                healthCondition.setName(conditionName);
                healthCondition.setPatient(patient);
                patient.getHealthConditions().add(healthCondition);
            }
        }

        // Update allergies
        if (request.getAllergies() != null) {
            for (String allergyName : request.getAllergies()) {
                Allergy allergy = new Allergy();
                allergy.setName(allergyName);
                if ("Medicine / Drug Allergy".equals(allergyName)) {
                    allergy.setSpecification(request.getMedicineAllergySpecification());
                }
                allergy.setPatient(patient);
                patient.getAllergies().add(allergy);
            }
        }

        // Update previous treatments
        if (request.getPreviousTreatments() != null) {
            for (String treatmentName : request.getPreviousTreatments()) {
                PreviousTreatment previousTreatment = new PreviousTreatment();
                previousTreatment.setName(treatmentName);
                previousTreatment.setPatient(patient);
                patient.getPreviousTreatments().add(previousTreatment);
            }
        }

        patient.setProfileCompleted(true);
        patientRepository.save(patient);
        log.info("Patient profile updated successfully for patientId: {}", patientId);
    }

    @Override
    @Transactional
    public void updateMyPatientProfile(PatientProfileRequest request) {
        User authenticatedUser = (User) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        if (authenticatedUser.getPatient() == null) {
            log.warn("Authenticated user {} is not associated with a patient profile.", authenticatedUser.getEmail());
            throw new ResourceNotFoundException("Authenticated user is not associated with a patient profile.");
        }
        Long patientId = authenticatedUser.getPatient().getId();
        log.info("Authenticated user {} attempting to update their own profile with patientId: {}", authenticatedUser.getEmail(), patientId);
        updatePatientProfile(patientId, request);
    }
}