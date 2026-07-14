package com.panchakarma.management.controller;

import com.panchakarma.management.dto.BookingRequest;
import com.panchakarma.management.dto.BookingResponse;
import com.panchakarma.management.dto.DoshaAssessmentRequest;
import com.panchakarma.management.dto.DoshaAssessmentResponse;
import com.panchakarma.management.dto.PatientBookingRequest;
import com.panchakarma.management.exception.ResourceNotFoundException;
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


    @PostMapping
    public ResponseEntity<Patient> createPatient(@RequestBody Patient patient) {
        Patient createdPatient = patientService.createPatient(patient);
        return new ResponseEntity<>(createdPatient, HttpStatus.CREATED);
    }

    @GetMapping
    public ResponseEntity<List<Patient>> getAllPatients() {
        List<Patient> patients = patientService.getAllPatients();
        return new ResponseEntity<>(patients, HttpStatus.OK);
    }

    @GetMapping("/details/{id}")
    public ResponseEntity<Patient> getPatientById(@PathVariable Long id) {
        Patient patient = patientService.getPatientById(id);
        if (patient != null) {
            return new ResponseEntity<>(patient, HttpStatus.OK);
        }
        return new ResponseEntity<>(HttpStatus.NOT_FOUND);
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
    public ResponseEntity<BookingResponse> bookTherapy(@RequestBody PatientBookingRequest patientBookingRequest, Principal principal) {
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
        bookingRequest.setBookingType(patientBookingRequest.getType());
        bookingRequest.setBookingStatus(com.panchakarma.management.model.BookingStatus.PENDING); // Default to PENDING

        BookingResponse createdBooking = bookingService.createBooking(bookingRequest);
        return new ResponseEntity<>(createdBooking, HttpStatus.CREATED);
    }

    @PostMapping("/book-consultation")
    public ResponseEntity<BookingResponse> bookConsultation(@RequestBody PatientBookingRequest patientBookingRequest, Principal principal) {
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
        bookingRequest.setBookingType(patientBookingRequest.getType());
        bookingRequest.setBookingStatus(com.panchakarma.management.model.BookingStatus.PENDING); // Default to PENDING

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

}