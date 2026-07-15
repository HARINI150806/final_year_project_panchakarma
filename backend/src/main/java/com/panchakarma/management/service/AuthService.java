package com.panchakarma.management.service;

import com.panchakarma.management.dto.AuthResponse;
import com.panchakarma.management.dto.LoginRequest;
import com.panchakarma.management.dto.RegisterRequest;
import com.panchakarma.management.model.Patient;
import com.panchakarma.management.model.User;
import com.panchakarma.management.model.UserRole;
import com.panchakarma.management.repository.PatientRepository;
import com.panchakarma.management.repository.UserRepository;
import com.panchakarma.management.security.JwtService;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PatientRepository patientRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;

    public AuthService(
            UserRepository userRepository,
            PatientRepository patientRepository,
            PasswordEncoder passwordEncoder,
            JwtService jwtService,
            AuthenticationManager authenticationManager
    ) {
        this.userRepository = userRepository;
        this.patientRepository = patientRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.authenticationManager = authenticationManager;
    }

    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.email())) {
            throw new IllegalArgumentException("Email is already registered");
        }

        User user = new User();
        user.setFullName(request.fullName());
        user.setEmail(request.email().toLowerCase());
        user.setPhone(request.phone());
        user.setPassword(passwordEncoder.encode(request.password()));
        user.setGender(request.gender());
        user.setAge(request.age());
        user.setRole(UserRole.PATIENT);

        User savedUser = userRepository.save(user);
        createPatientProfile(savedUser);
        String token = jwtService.generateToken(savedUser.getEmail(), savedUser.getRole().name());
        return new AuthResponse(
                token,
                savedUser.getId(),
                savedUser.getFullName(),
                savedUser.getEmail(),
                savedUser.getRole(),
                savedUser.isDoshaAssessmentCompleted(),
                savedUser.getDominantDosha(),
                savedUser.getDoshaAssessmentDate(),
                false
        );
    }

    public AuthResponse login(LoginRequest request) {
        String email = request.email().toLowerCase();
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(email, request.password())
        );

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("Invalid credentials"));

        boolean isProfileCompleted = false;
        boolean doshaAssessmentCompleted = user.isDoshaAssessmentCompleted();
        String dominantDosha = user.getDominantDosha();
        java.time.LocalDateTime doshaAssessmentDate = user.getDoshaAssessmentDate();
        if (user.getRole() == UserRole.PATIENT) {
            Patient patient = patientRepository.findByUser(user)
                    .orElseThrow(() -> new IllegalArgumentException("Patient profile not found"));
            isProfileCompleted = patient.isProfileCompleted();
            doshaAssessmentCompleted = patient.isDoshaAssessmentCompleted();
            dominantDosha = patient.getDominantDosha();
            doshaAssessmentDate = patient.getDoshaAssessmentDate() != null
                    ? patient.getDoshaAssessmentDate().atStartOfDay()
                    : null;
        }

        String token = jwtService.generateToken(user.getEmail(), user.getRole().name());
        return new AuthResponse(
                token,
                user.getId(),
                user.getFullName(),
                user.getEmail(),
                user.getRole(),
                doshaAssessmentCompleted,
                dominantDosha,
                doshaAssessmentDate,
                isProfileCompleted
        );
    }

    private void createPatientProfile(User user) {
        Patient patient = new Patient();
        String fullName = user.getFullName() == null ? "" : user.getFullName().trim();
        String[] nameParts = fullName.split("\\s+", 2);
        patient.setFirstName(nameParts.length > 0 ? nameParts[0] : "");
        patient.setLastName(nameParts.length > 1 ? nameParts[1] : "");
        patient.setEmail(user.getEmail());
        patient.setContactNumber(user.getPhone());
        patient.setGender(user.getGender());
        patient.setUser(user);
        patientRepository.save(patient);
        user.setPatient(patient); // Establish bidirectional link
        userRepository.save(user); // Save user to update the patient reference
    }
}
