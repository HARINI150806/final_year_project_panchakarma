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

    @org.springframework.beans.factory.annotation.Autowired
    private com.panchakarma.management.repository.PatientRepository patientRepository;

    @org.springframework.beans.factory.annotation.Autowired
    private com.panchakarma.management.repository.BookingRepository bookingRepository;

    @org.springframework.beans.factory.annotation.Autowired
    private com.panchakarma.management.repository.TreatmentPlanRepository treatmentPlanRepository;

    @org.springframework.beans.factory.annotation.Autowired
    private com.panchakarma.management.repository.FollowUpRepository followUpRepository;

    @org.springframework.beans.factory.annotation.Autowired
    private com.panchakarma.management.repository.ComplaintRepository complaintRepository;

    @org.springframework.beans.factory.annotation.Autowired
    private com.panchakarma.management.repository.NotificationRepository notificationRepository;

    @org.springframework.beans.factory.annotation.Autowired
    private com.panchakarma.management.repository.EmailVerificationRepository emailVerificationRepository;

    @org.springframework.beans.factory.annotation.Autowired
    private com.panchakarma.management.repository.TherapistWeeklyScheduleRepository therapistWeeklyScheduleRepository;

    @org.springframework.beans.factory.annotation.Autowired
    private com.panchakarma.management.repository.TherapistDateOverrideRepository therapistDateOverrideRepository;

    @org.springframework.beans.factory.annotation.Autowired
    private com.panchakarma.management.repository.TherapistAvailabilityRepository therapistAvailabilityRepository;

    public AdminService(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @org.springframework.transaction.annotation.Transactional
    public void deleteUser(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found with id: " + userId));

        // 1. Delete followups
        List<com.panchakarma.management.model.FollowUp> followupsPatient = followUpRepository.findByPatientIdOrderByFollowupDateAsc(userId);
        followUpRepository.deleteAll(followupsPatient);
        List<com.panchakarma.management.model.FollowUp> followupsTherapist = followUpRepository.findByTherapistIdOrderByFollowupDateAsc(userId);
        followUpRepository.deleteAll(followupsTherapist);

        // 2. Delete email verification
        emailVerificationRepository.deleteByEmail(user.getEmail());

        // 3. Delete notifications
        List<com.panchakarma.management.model.Notification> notifications = notificationRepository.findByUserOrderByCreatedAtDesc(user);
        notificationRepository.deleteAll(notifications);

        // 4. Role-specific deletion
        if (user.getRole() == UserRole.THERAPIST) {
            // Delete schedule & overrides
            List<com.panchakarma.management.model.TherapistWeeklySchedule> schedules = therapistWeeklyScheduleRepository.findByTherapist(user);
            therapistWeeklyScheduleRepository.deleteAll(schedules);

            List<com.panchakarma.management.model.TherapistDateOverride> overrides = therapistDateOverrideRepository.findByTherapist(user);
            therapistDateOverrideRepository.deleteAll(overrides);

            List<com.panchakarma.management.model.TherapistAvailability> availability = therapistAvailabilityRepository.findByTherapist(user);
            therapistAvailabilityRepository.deleteAll(availability);

            // Nullify bookings
            List<com.panchakarma.management.model.Booking> bookings = bookingRepository.findByAssignedTo_Id(userId);
            for (com.panchakarma.management.model.Booking b : bookings) {
                b.setAssignedTo(null);
                b.setTherapistName("Deleted Specialist");
                bookingRepository.save(b);
            }

            // Nullify treatment plans
            List<com.panchakarma.management.model.TreatmentPlan> plans = treatmentPlanRepository.findByAssignedTherapist_Id(userId);
            for (com.panchakarma.management.model.TreatmentPlan p : plans) {
                p.setAssignedTherapist(null);
                treatmentPlanRepository.save(p);
            }
            List<com.panchakarma.management.model.TreatmentPlan> plansPrescribed = treatmentPlanRepository.findByPrescribedBy_Id(userId);
            for (com.panchakarma.management.model.TreatmentPlan p : plansPrescribed) {
                p.setPrescribedBy(null);
                treatmentPlanRepository.save(p);
            }
        } else if (user.getRole() == UserRole.PATIENT) {
            // Delete patient profile
            if (user.getPatient() != null) {
                patientRepository.delete(user.getPatient());
            }

            // Delete bookings
            List<com.panchakarma.management.model.Booking> bookings = bookingRepository.findByPatient_Id(userId);
            bookingRepository.deleteAll(bookings);

            // Delete treatment plans
            List<com.panchakarma.management.model.TreatmentPlan> plans = treatmentPlanRepository.findByPatient_Id(userId);
            treatmentPlanRepository.deleteAll(plans);

            // Delete complaints
            if (user.getPatient() != null) {
                List<com.panchakarma.management.model.Complaint> complaints = complaintRepository.findByPatientId(user.getPatient().getId());
                complaintRepository.deleteAll(complaints);
            }
        }

        // 5. Finally delete the user
        userRepository.delete(user);
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

    public com.panchakarma.management.dto.PharmacistSummaryResponse createPharmacist(com.panchakarma.management.dto.AdminPharmacistRequest request) {
        String email = request.email().toLowerCase(Locale.ROOT);
        if (userRepository.existsByEmail(email)) {
            throw new IllegalArgumentException("Email is already registered");
        }

        User user = new User();
        user.setFullName(request.fullName());
        user.setEmail(email);
        user.setPhone(request.phone());
        user.setPassword(passwordEncoder.encode(request.password()));
        user.setGender(request.gender() != null ? request.gender() : "Male");
        user.setAge(request.age() != null ? request.age() : 30);
        user.setPharmacyName(request.pharmacyName() != null && !request.pharmacyName().isBlank() ? request.pharmacyName() : "Panchakarma Care Central Pharmacy");
        user.setRole(UserRole.PHARMACIST);

        userRepository.save(user);

        return new com.panchakarma.management.dto.PharmacistSummaryResponse(
                user.getId(),
                user.getFullName(),
                user.getEmail(),
                user.getPhone(),
                user.getGender(),
                user.getAge(),
                user.getPharmacyName(),
                user.getCreatedAt()
        );
    }

    public List<com.panchakarma.management.dto.PharmacistSummaryResponse> listPharmacists() {
        return userRepository.findAll().stream()
                .filter(user -> user.getRole() == UserRole.PHARMACIST)
                .sorted(Comparator.comparing(User::getCreatedAt, Comparator.nullsLast(Comparator.naturalOrder())).reversed())
                .map(u -> new com.panchakarma.management.dto.PharmacistSummaryResponse(
                        u.getId(), u.getFullName(), u.getEmail(), u.getPhone(), u.getGender(), u.getAge(), u.getPharmacyName(), u.getCreatedAt()
                ))
                .toList();
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
