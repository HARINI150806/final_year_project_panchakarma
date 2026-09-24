package com.panchakarma.management.service;

import com.panchakarma.management.dto.AuthResponse;
import com.panchakarma.management.dto.LoginRequest;
import com.panchakarma.management.dto.RegisterRequest;
import com.panchakarma.management.model.Patient;
import com.panchakarma.management.model.User;
import com.panchakarma.management.model.UserRole;
import com.panchakarma.management.repository.PatientRepository;
import com.panchakarma.management.repository.UserRepository;
import com.panchakarma.management.repository.EmailVerificationRepository;
import com.panchakarma.management.repository.PasswordResetRepository;
import com.panchakarma.management.model.EmailVerification;
import com.panchakarma.management.model.PasswordReset;
import com.panchakarma.management.security.JwtService;
import java.time.LocalDateTime;
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
    private final EmailService emailService;
    private final EmailVerificationRepository emailVerificationRepository;
    private final PasswordResetRepository passwordResetRepository;

    public AuthService(
            UserRepository userRepository,
            PatientRepository patientRepository,
            PasswordEncoder passwordEncoder,
            JwtService jwtService,
            AuthenticationManager authenticationManager,
            EmailService emailService,
            EmailVerificationRepository emailVerificationRepository,
            PasswordResetRepository passwordResetRepository
    ) {
        this.userRepository = userRepository;
        this.patientRepository = patientRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.authenticationManager = authenticationManager;
        this.emailService = emailService;
        this.emailVerificationRepository = emailVerificationRepository;
        this.passwordResetRepository = passwordResetRepository;
    }

    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.email())) {
            throw new IllegalArgumentException("Email is already registered");
        }

        // Verify OTP code
        String email = request.email().trim().toLowerCase();
        EmailVerification verification = emailVerificationRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("No verification code found for this email. Please request a new code."));

        if (!verification.getOtpCode().equals(request.otpCode().trim())) {
            throw new IllegalArgumentException("Invalid email verification code");
        }

        if (verification.getExpiresAt().isBefore(LocalDateTime.now())) {
            emailVerificationRepository.delete(verification);
            throw new IllegalArgumentException("Verification code has expired. Please request a new code.");
        }

        // OTP is valid, remove it so it cannot be reused
        emailVerificationRepository.delete(verification);

        User user = new User();
        user.setFullName(request.fullName());
        user.setEmail(email);
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

    @org.springframework.transaction.annotation.Transactional
    public void forgotPassword(String email) {
        String trimmedEmail = email.trim().toLowerCase();
        User user = userRepository.findByEmail(trimmedEmail)
                .orElseThrow(() -> new IllegalArgumentException("Email is not registered"));

        // Generate a 6-digit random code
        String code = String.valueOf((int) (Math.random() * 900000 + 100000));

        // Upsert password reset record (valid for 10 minutes)
        PasswordReset passwordReset = passwordResetRepository.findByEmail(trimmedEmail)
                .orElse(new PasswordReset());
        passwordReset.setEmail(trimmedEmail);
        passwordReset.setOtpCode(code);
        passwordReset.setExpiresAt(LocalDateTime.now().plusMinutes(10));
        passwordResetRepository.save(passwordReset);

        // Send real email containing recovery code
        emailService.sendForgotPasswordEmail(user.getEmail(), user.getFullName(), code);
    }

    @org.springframework.transaction.annotation.Transactional
    public void resetPassword(String email, String otpCode, String newPassword) {
        String trimmedEmail = email.trim().toLowerCase();
        User user = userRepository.findByEmail(trimmedEmail)
                .orElseThrow(() -> new IllegalArgumentException("Email is not registered"));

        PasswordReset passwordReset = passwordResetRepository.findByEmail(trimmedEmail)
                .orElseThrow(() -> new IllegalArgumentException("No password reset request found. Please request a new code."));

        if (!passwordReset.getOtpCode().equals(otpCode.trim())) {
            throw new IllegalArgumentException("Invalid password reset verification code");
        }

        if (passwordReset.getExpiresAt().isBefore(LocalDateTime.now())) {
            passwordResetRepository.delete(passwordReset);
            throw new IllegalArgumentException("Verification code has expired. Please request a new code.");
        }

        if (newPassword == null || newPassword.trim().length() < 6) {
            throw new IllegalArgumentException("Password must be at least 6 characters long.");
        }

        // OTP is valid, update user password
        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);

        // Delete password reset token so it cannot be reused
        passwordResetRepository.delete(passwordReset);
    }


    @org.springframework.transaction.annotation.Transactional
    public String sendVerificationCode(String email) {
        String trimmedEmail = email.trim().toLowerCase();
        
        // 1. Check if email is already registered
        if (userRepository.existsByEmail(trimmedEmail)) {
            throw new IllegalArgumentException("Email is already registered. Please login instead.");
        }

        // 2. Generate a 6-digit random code
        String code = String.valueOf((int) (Math.random() * 900000 + 100000));

        // 3. Upsert verification code valid for 10 minutes
        EmailVerification verification = emailVerificationRepository.findByEmail(trimmedEmail)
                .orElse(new EmailVerification());
        verification.setEmail(trimmedEmail);
        verification.setOtpCode(code);
        verification.setExpiresAt(LocalDateTime.now().plusMinutes(10));
        emailVerificationRepository.save(verification);

        // 4. Send code via EmailService
        emailService.sendVerificationCodeEmail(trimmedEmail, code);

        return code;
    }
}
