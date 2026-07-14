package com.panchakarma.management.service.impl;

import com.panchakarma.management.dto.ComplaintRequest;
import com.panchakarma.management.dto.ComplaintResponse;
import com.panchakarma.management.exception.ResourceNotFoundException;
import com.panchakarma.management.model.*;
import com.panchakarma.management.model.enums.ComplaintStatus;
import com.panchakarma.management.repository.ComplaintRepository;
import com.panchakarma.management.repository.PatientRepository;
import com.panchakarma.management.repository.UserRepository;
import com.panchakarma.management.service.ComplaintService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class ComplaintServiceImpl implements ComplaintService {

    @Autowired
    private ComplaintRepository complaintRepository;

    @Autowired
    private PatientRepository patientRepository;

    @Autowired
    private UserRepository userRepository;

    @Override
    @Transactional
    public ComplaintResponse createComplaint(ComplaintRequest complaintRequest) {
        User user = getCurrentUser();
        Patient patient = getOrCreatePatient(user);

        Complaint complaint = new Complaint();
        complaint.setPatient(patient);
        complaint.setMainComplaint(complaintRequest.getMainComplaint());
        complaint.setOtherComplaint(complaintRequest.getOtherComplaint());
        complaint.setBodyArea(complaintRequest.getBodyArea());
        complaint.setOtherBodyArea(complaintRequest.getOtherBodyArea());
        complaint.setSeverity(complaintRequest.getSeverity());
        complaint.setDurationValue(complaintRequest.getDurationValue());
        complaint.setDurationUnit(complaintRequest.getDurationUnit());
        complaint.setFrequency(complaintRequest.getFrequency());
        complaint.setPainLevel(complaintRequest.getPainLevel());
        complaint.setAdditionalDetails(complaintRequest.getAdditionalDetails());
        complaint.setStatus(ComplaintStatus.SUBMITTED);

        if (complaintRequest.getSymptoms() != null) {
            List<ComplaintSymptom> symptoms = complaintRequest.getSymptoms().stream().map(symptomRequest -> {
                ComplaintSymptom complaintSymptom = new ComplaintSymptom();
                complaintSymptom.setSymptomName(symptomRequest.getSymptomName());
                complaintSymptom.setOtherSymptomDetails(symptomRequest.getOtherSymptomDetails());
                complaintSymptom.setComplaint(complaint);
                return complaintSymptom;
            }).collect(Collectors.toList());
            complaint.setSymptoms(symptoms);
        }

        Complaint savedComplaint = complaintRepository.save(complaint);
        return mapToComplaintResponse(savedComplaint);
    }

    @Transactional
    @Override
    public List<ComplaintResponse> getPatientComplaints() {
        User user = getCurrentUser();
        Patient patient = getOrCreatePatient(user);

        List<Complaint> complaints = complaintRepository.findByPatientId(patient.getId());
        return complaints.stream().map(this::mapToComplaintResponse).collect(Collectors.toList());
    }

    @Override
    public ComplaintResponse getComplaintById(Long id) {
        User user = getCurrentUser();
        Patient patient = getOrCreatePatient(user);

        Complaint complaint = complaintRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Complaint not found with id: " + id));

        if (!complaint.getPatient().getId().equals(patient.getId())) {
            throw new SecurityException("You are not authorized to view this complaint.");
        }

        return mapToComplaintResponse(complaint);
    }

    @Override
    @Transactional
    public ComplaintResponse updateComplaint(Long id, ComplaintRequest complaintRequest) {
        User user = getCurrentUser();
        Patient patient = getOrCreatePatient(user);

        Complaint complaint = complaintRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Complaint not found with id: " + id));

        if (!complaint.getPatient().getId().equals(patient.getId())) {
            throw new SecurityException("You are not authorized to update this complaint.");
        }

        if (complaint.getStatus() != ComplaintStatus.SUBMITTED) {
            throw new IllegalStateException("Complaint cannot be updated as it is already " + complaint.getStatus());
        }

        complaint.setMainComplaint(complaintRequest.getMainComplaint());
        complaint.setOtherComplaint(complaintRequest.getOtherComplaint());
        complaint.setBodyArea(complaintRequest.getBodyArea());
        complaint.setOtherBodyArea(complaintRequest.getOtherBodyArea());
        complaint.setSeverity(complaintRequest.getSeverity());
        complaint.setDurationValue(complaintRequest.getDurationValue());
        complaint.setDurationUnit(complaintRequest.getDurationUnit());
        complaint.setFrequency(complaintRequest.getFrequency());
        complaint.setPainLevel(complaintRequest.getPainLevel());
        complaint.setAdditionalDetails(complaintRequest.getAdditionalDetails());

        if (complaint.getSymptoms() == null) {
            complaint.setSymptoms(new ArrayList<>());
        } else {
            complaint.getSymptoms().clear();
        }
        List<ComplaintSymptom> symptoms = complaintRequest.getSymptoms().stream().map(symptomRequest -> {
            ComplaintSymptom complaintSymptom = new ComplaintSymptom();
            complaintSymptom.setSymptomName(symptomRequest.getSymptomName());
            complaintSymptom.setOtherSymptomDetails(symptomRequest.getOtherSymptomDetails());
            complaintSymptom.setComplaint(complaint);
            return complaintSymptom;
        }).collect(Collectors.toList());
        complaint.getSymptoms().addAll(symptoms);

        Complaint updatedComplaint = complaintRepository.save(complaint);
        return mapToComplaintResponse(updatedComplaint);
    }

    @Override
    public List<ComplaintResponse> getAllComplaints() {
        List<Complaint> complaints = complaintRepository.findAll();
        return complaints.stream().map(this::mapToComplaintResponse).collect(Collectors.toList());
    }

    private ComplaintResponse mapToComplaintResponse(Complaint complaint) {
        ComplaintResponse response = new ComplaintResponse();
        response.setId(complaint.getId());
        response.setMainComplaint(complaint.getMainComplaint());
        response.setOtherComplaint(complaint.getOtherComplaint());
        response.setBodyArea(complaint.getBodyArea());
        response.setOtherBodyArea(complaint.getOtherBodyArea());
        response.setSeverity(complaint.getSeverity());
        response.setDurationValue(complaint.getDurationValue());
        response.setDurationUnit(complaint.getDurationUnit());
        response.setFrequency(complaint.getFrequency());
        response.setPainLevel(complaint.getPainLevel());
        response.setAdditionalDetails(complaint.getAdditionalDetails());
        response.setStatus(complaint.getStatus());
        response.setCreatedAt(complaint.getCreatedAt());

        List<ComplaintResponse.SymptomResponse> symptomResponses = complaint.getSymptoms().stream().map(symptom -> {
            ComplaintResponse.SymptomResponse symptomResponse = new ComplaintResponse.SymptomResponse();
            symptomResponse.setSymptomName(symptom.getSymptomName());
            symptomResponse.setOtherSymptomDetails(symptom.getOtherSymptomDetails());
            return symptomResponse;
        }).collect(Collectors.toList());
        response.setSymptoms(symptomResponses);

        return response;
    }

    private User getCurrentUser() {
        UserDetails userDetails = (UserDetails) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        String username = userDetails.getUsername();
        return userRepository.findByEmail(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + username));
    }

    private Patient getOrCreatePatient(User user) {
        return patientRepository.findByUser(user)
                .orElseGet(() -> {
                    Patient patient = new Patient();
                    String fullName = user.getFullName() == null ? "" : user.getFullName().trim();
                    String[] nameParts = fullName.split("\\s+", 2);
                    patient.setFirstName(nameParts.length > 0 ? nameParts[0] : "");
                    patient.setLastName(nameParts.length > 1 ? nameParts[1] : "");
                    patient.setEmail(user.getEmail());
                    patient.setContactNumber(user.getPhone());
                    patient.setGender(user.getGender());
                    patient.setUser(user);
                    return patientRepository.save(patient);
                });
    }
}