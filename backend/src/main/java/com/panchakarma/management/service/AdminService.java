package com.panchakarma.management.service;

import com.panchakarma.management.dto.AdminTherapistRequest;
import com.panchakarma.management.dto.PatientSummaryResponse;
import com.panchakarma.management.dto.TherapistSummaryResponse;
import com.panchakarma.management.model.User;
import com.panchakarma.management.model.UserRole;
import com.panchakarma.management.repository.UserRepository;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AdminService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public AdminService(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public TherapistSummaryResponse createTherapist(AdminTherapistRequest request) {
        String email = request.email().toLowerCase(Locale.ROOT);
        if (userRepository.existsByEmail(email)) {
            throw new IllegalArgumentException("Email is already registered");
        }

        User user = new User();
        user.setFullName(request.fullName());
        user.setEmail(email);
        user.setPhone(request.phone());
        user.setPassword(passwordEncoder.encode(request.password()));
        user.setGender(request.gender());
        user.setAge(request.age());
        user.setRole(UserRole.THERAPIST);

        userRepository.save(user);
        
        return new TherapistSummaryResponse(
                user.getId(),
                user.getFullName(),
                user.getEmail(),
                user.getPhone(),
                user.getGender(),
                user.getAge(),
                user.getCreatedAt()
        );
    }

    public List<TherapistSummaryResponse> listTherapists() {
        return userRepository.findAll().stream()
                .filter(user -> user.getRole() == UserRole.THERAPIST)
                .sorted(Comparator.comparing(User::getCreatedAt, Comparator.nullsLast(Comparator.naturalOrder())).reversed())
                .map(this::toSummary)
                .toList();
    }

    public List<PatientSummaryResponse> listPatients() {
        return userRepository.findAll().stream()
                .filter(user -> user.getRole() == UserRole.PATIENT)
                .sorted(Comparator.comparing(User::getCreatedAt, Comparator.nullsLast(Comparator.naturalOrder())).reversed())
                .map(this::toPatientSummary)
                .toList();
    }

    private TherapistSummaryResponse toSummary(User user) {
        return new TherapistSummaryResponse(
                user.getId(),
                user.getFullName(),
                user.getEmail(),
                user.getPhone(),
                user.getGender(),
                user.getAge(),
                user.getCreatedAt()
        );
    }

    private PatientSummaryResponse toPatientSummary(User user) {
        String dominantDosha = user.getPatient() != null ? user.getPatient().getDominantDosha() : user.getDominantDosha();
        boolean assessmentCompleted = user.getPatient() != null
                ? user.getPatient().isDoshaAssessmentCompleted()
                : user.isDoshaAssessmentCompleted();
        return new PatientSummaryResponse(
                user.getId(),
                user.getFullName(),
                user.getEmail(),
                user.getPhone(),
                user.getGender(),
                user.getAge(),
                dominantDosha,
                assessmentCompleted,
                user.getCreatedAt()
        );
    }
}
