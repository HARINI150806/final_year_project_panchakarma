package com.panchakarma.management.controller;

import com.panchakarma.management.dto.BookingRequest;
import com.panchakarma.management.dto.BookingResponse;
import com.panchakarma.management.dto.DoshaAssessmentRequest;
import com.panchakarma.management.dto.DoshaAssessmentResponse;
import com.panchakarma.management.dto.PatientBookingRequest;
import com.panchakarma.management.exception.ResourceNotFoundException;
import com.panchakarma.management.model.BookingType;
import com.panchakarma.management.model.Patient;
import com.panchakarma.management.model.User;
import com.panchakarma.management.repository.UserRepository;
import com.panchakarma.management.service.BookingService;
import com.panchakarma.management.service.PatientService;
import com.panchakarma.management.service.TherapistService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

import com.panchakarma.management.dto.PatientClinicalDetailsResponse;
import com.panchakarma.management.model.Prescription;
import com.panchakarma.management.repository.PatientRepository;
import com.panchakarma.management.repository.PrescriptionRepository;

import java.time.LocalDate;
import java.time.Period;

@RestController
@RequestMapping("/api/patient") // Changed to /api/patient to match frontend
public class PatientController {

    @Autowired
    private PatientService patientService;

    @Autowired
    private BookingService bookingService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private TherapistService therapistService;

    @Autowired
    private PatientRepository patientRepository;

    @Autowired
    private PrescriptionRepository prescriptionRepository;

    @PostMapping
    public ResponseEntity<Patient> createPatient(@RequestBody Patient patient) {
        Patient createdPatient = patientService.createPatient(patient);
        return new ResponseEntity<>(createdPatient, HttpStatus.CREATED);
    }

    @GetMapping("/all")
    public ResponseEntity<List<Patient>> getAllPatients() {
        List<Patient> patients = patientService.getAllPatients();
        return new ResponseEntity<>(patients, HttpStatus.OK);
    }

    @GetMapping("/details/{id}")
    public ResponseEntity<PatientClinicalDetailsResponse> getPatientClinicalDetails(@PathVariable Long id) {
        User user = userRepository.findById(id)
                .orElseGet(() -> patientRepository.findById(id)
                        .map(Patient::getUser)
                        .orElse(null));

        Patient patient = (user != null)
                ? patientRepository.findByUser(user).orElse(null)
                : patientRepository.findById(id).orElse(null);

        if (patient == null && user == null) {
            return ResponseEntity.notFound().build();
        }

        Long targetUserId = (user != null) ? user.getId()
                : (patient != null && patient.getUser() != null ? patient.getUser().getId() : id);
        String name = (user != null) ? user.getFullName()
                : (patient != null ? patient.getFirstName() + " " + patient.getLastName() : "Patient");
        String email = (user != null) ? user.getEmail() : (patient != null ? patient.getEmail() : "");
        String phone = (patient != null) ? patient.getContactNumber() : null;
        String gender = (patient != null && patient.getGender() != null && !patient.getGender().isBlank())
                ? patient.getGender()
                : (user != null ? user.getGender() : null);

        Integer age = null;
        if (patient != null && patient.getDateOfBirth() != null) {
            age = Period.between(patient.getDateOfBirth(), LocalDate.now()).getYears();
        } else if (user != null && user.getAge() != null) {
            age = user.getAge();
        }

        Double height = (patient != null && patient.getHeight() != null) ? patient.getHeight() : null;
        Double weight = (patient != null && patient.getWeight() != null) ? patient.getWeight() : null;
        String occ = (patient != null) ? patient.getOccupation() : null;

        // Only return real dosha data — never use fallback defaults
        boolean doshaAssessed = patient != null && patient.isDoshaAssessmentCompleted();
        String dominantDosha = (doshaAssessed && patient.getDominantDosha() != null) ? patient.getDominantDosha()
                : null;
        Integer vata = (doshaAssessed && patient.getVataScore() != null) ? patient.getVataScore() : null;
        Integer pitta = (doshaAssessed && patient.getPittaScore() != null) ? patient.getPittaScore() : null;
        Integer kapha = (doshaAssessed && patient.getKaphaScore() != null) ? patient.getKaphaScore() : null;

        List<Prescription> pastRx = prescriptionRepository.findByPatientIdOrderByCreatedAtDesc(targetUserId);

        PatientClinicalDetailsResponse response = new PatientClinicalDetailsResponse(
                targetUserId,
                name,
                email,
                phone,
                gender,
                age,
                height,
                weight,
                occ,
                dominantDosha,
                vata,
                pitta,
                kapha,
                doshaAssessed,
                null,
                null,
                null,
                null,
                pastRx);

        return ResponseEntity.ok(response);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Patient> updatePatient(@PathVariable Long id, @RequestBody Patient patient) {
        Patient updatedPatient = patientService.updatePatient(id, patient);
        if (updatedPatient != null) {
            return new ResponseEntity<>(updatedPatient, HttpStatus.OK);
        }
        return new ResponseEntity<>(HttpStatus.NOT_FOUND);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletePatient(@PathVariable Long id) {
        patientService.deletePatient(id);
        return new ResponseEntity<>(HttpStatus.NO_CONTENT);
    }

    @GetMapping("/therapists")
    public ResponseEntity<List<User>> listTherapists() {
        List<User> therapists = therapistService.listTherapists();
        return new ResponseEntity<>(therapists, HttpStatus.OK);
    }

    @GetMapping("/bookings")
    public ResponseEntity<List<BookingResponse>> getMyBookings(Principal principal) {
        if (principal == null) {
            return new ResponseEntity<>(HttpStatus.UNAUTHORIZED);
        }
        String username = principal.getName();
        User user = userRepository.findByEmail(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + username));

        List<BookingResponse> bookings = bookingService.getBookingsByPatientId(user.getId());
        return new ResponseEntity<>(bookings, HttpStatus.OK);
    }

    @PostMapping("/book-therapy")
    public ResponseEntity<BookingResponse> bookTherapy(@RequestBody PatientBookingRequest patientBookingRequest,
            Principal principal) {
        if (principal == null) {
            return new ResponseEntity<>(HttpStatus.UNAUTHORIZED);
        }
        String username = principal.getName();
        User user = userRepository.findByEmail(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + username));

        BookingRequest bookingRequest = new BookingRequest();
        bookingRequest.setPatientId(user.getId());
        bookingRequest.setAssignedToId(patientBookingRequest.getAssignedTo());
        bookingRequest.setDate(patientBookingRequest.getDate());
        bookingRequest.setTime(patientBookingRequest.getTime());
        bookingRequest.setPurpose(patientBookingRequest.getNotes());
        bookingRequest.setBookingType(
                patientBookingRequest.getType() != null ? patientBookingRequest.getType() : BookingType.THERAPY);
        bookingRequest.setBookingStatus(com.panchakarma.management.model.BookingStatus.CONFIRMED); // Default to
                                                                                                   // CONFIRMED

        BookingResponse createdBooking = bookingService.createBooking(bookingRequest);
        return new ResponseEntity<>(createdBooking, HttpStatus.CREATED);
    }

    @PostMapping("/book-consultation")
    public ResponseEntity<BookingResponse> bookConsultation(@RequestBody PatientBookingRequest patientBookingRequest,
            Principal principal) {
        if (principal == null) {
            return new ResponseEntity<>(HttpStatus.UNAUTHORIZED);
        }
        String username = principal.getName();
        User user = userRepository.findByEmail(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + username));

        BookingRequest bookingRequest = new BookingRequest();
        bookingRequest.setPatientId(user.getId());
        bookingRequest.setDate(patientBookingRequest.getDate());
        bookingRequest.setTime(patientBookingRequest.getTime());
        bookingRequest.setPurpose(patientBookingRequest.getNotes());
        bookingRequest.setBookingType(
                patientBookingRequest.getType() != null ? patientBookingRequest.getType() : BookingType.CONSULTATION);
        bookingRequest.setConsultationCategory(patientBookingRequest.getConsultationCategory() != null
                ? patientBookingRequest.getConsultationCategory()
                : "THERAPY_RECOMMENDATION");
        bookingRequest.setBookingStatus(com.panchakarma.management.model.BookingStatus.CONFIRMED); // Default to
                                                                                                   // CONFIRMED

        BookingResponse createdBooking = bookingService.createBooking(bookingRequest);
        return new ResponseEntity<>(createdBooking, HttpStatus.CREATED);
    }

    @PostMapping("/dosha-assessment")
    public ResponseEntity<DoshaAssessmentResponse> performDoshaAssessment(@RequestBody DoshaAssessmentRequest request) {
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        String username;
        if (principal instanceof org.springframework.security.core.userdetails.UserDetails) {
            username = ((org.springframework.security.core.userdetails.UserDetails) principal).getUsername();
        } else {
            username = principal.toString();
        }

        User authenticatedUser = userRepository.findByEmail(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + username));

        Long patientId = authenticatedUser.getPatient().getId(); // Assuming User has a Patient association
        DoshaAssessmentResponse response = patientService.performDoshaAssessment(patientId, request);
        return ResponseEntity.ok(response);
    }

    /**
     * GET /api/patient/notification-prefs — returns the current patient's
     * notification preferences
     */
    @GetMapping("/notification-prefs")
    public ResponseEntity<?> getNotificationPrefs(Principal principal) {
        User user = userRepository.findByEmail(principal.getName())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        return ResponseEntity.ok(java.util.Map.of(
                "inAppNotif", user.isInAppNotifEnabled(),
                "emailNotif", user.isEmailNotifEnabled()));
    }

    /**
     * PATCH /api/patient/notification-prefs — saves the patient's notification
     * preferences
     */
    @PatchMapping("/notification-prefs")
    public ResponseEntity<?> updateNotificationPrefs(@RequestBody java.util.Map<String, Boolean> prefs,
            Principal principal) {
        User user = userRepository.findByEmail(principal.getName())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        if (prefs.containsKey("inAppNotif")) {
            user.setInAppNotifEnabled(prefs.get("inAppNotif"));
        }
        if (prefs.containsKey("emailNotif")) {
            user.setEmailNotifEnabled(prefs.get("emailNotif"));
        }
        userRepository.save(user);
        return ResponseEntity.ok(java.util.Map.of(
                "inAppNotif", user.isInAppNotifEnabled(),
                "emailNotif", user.isEmailNotifEnabled()));
    }

}