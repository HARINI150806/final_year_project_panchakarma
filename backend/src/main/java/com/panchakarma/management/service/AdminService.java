package com.panchakarma.management.service;

import com.panchakarma.management.dto.AdminTherapistRequest;
import com.panchakarma.management.dto.PatientSummaryResponse;
import com.panchakarma.management.dto.TherapistSummaryResponse;
import com.panchakarma.management.model.User;
import com.panchakarma.management.model.UserRole;
import com.panchakarma.management.repository.UserRepository;
import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.stream.Collectors;
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

    @org.springframework.beans.factory.annotation.Autowired
    private com.panchakarma.management.repository.AppointmentRepository appointmentRepository;

    @org.springframework.beans.factory.annotation.Autowired
    private com.panchakarma.management.repository.PasswordResetRepository passwordResetRepository;

    @jakarta.persistence.PersistenceContext
    private jakarta.persistence.EntityManager entityManager;

    public AdminService(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    private void cleanupAllForeignKeysReferencingUser(Long userId) {
        if (entityManager == null) return;
        
        try {
            @SuppressWarnings("unchecked")
            List<Object[]> fkList = entityManager.createNativeQuery(
                "SELECT c.relname AS foreign_table, a.attname AS foreign_column, COALESCE(col.is_nullable, 'NO') AS is_nullable " +
                "FROM pg_constraint con " +
                "JOIN pg_class c ON con.conrelid = c.oid " +
                "JOIN pg_attribute a ON a.attrelid = c.oid AND a.attnum = ANY(con.conkey) " +
                "JOIN pg_class r ON con.confrelid = r.oid " +
                "LEFT JOIN information_schema.columns col ON col.table_schema = 'public' AND col.table_name = c.relname AND col.column_name = a.attname " +
                "WHERE con.contype = 'f' AND LOWER(r.relname) = 'users'"
            ).getResultList();

            for (Object[] row : fkList) {
                if (row == null || row.length < 2) continue;
                String tbl = row[0].toString();
                String col = row[1].toString();
                String isNullable = (row.length >= 3 && row[2] != null) ? row[2].toString() : "NO";

                if ("users".equalsIgnoreCase(tbl)) continue;

                if ("YES".equalsIgnoreCase(isNullable)) {
                    try {
                        entityManager.createNativeQuery(
                            "UPDATE " + tbl + " SET " + col + " = NULL WHERE " + col + " = ?1"
                        ).setParameter(1, userId).executeUpdate();
                    } catch (Exception e) {
                        System.err.println("Notice: Could not nullify " + tbl + "." + col + ": " + e.getMessage());
                    }
                } else {
                    try {
                        entityManager.createNativeQuery(
                            "DELETE FROM " + tbl + " WHERE " + col + " = ?1"
                        ).setParameter(1, userId).executeUpdate();
                    } catch (Exception e) {
                        System.err.println("Notice: Could not delete referencing rows from " + tbl + "." + col + ": " + e.getMessage());
                    }
                }
            }
            entityManager.flush();
        } catch (Exception e) {
            System.err.println("Notice: Dynamic pg_constraint cleanup skipped/failed: " + e.getMessage());
        }
    }

    @org.springframework.transaction.annotation.Transactional
    public void deleteUser(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found with id: " + userId));

        // 0. Automatically discover and clear ALL foreign keys pointing to users(id) in PostgreSQL
        cleanupAllForeignKeysReferencingUser(userId);

        // 1. Delete password reset & email verification tokens
        if (user.getEmail() != null) {
            try {
                if (passwordResetRepository != null) {
                    passwordResetRepository.deleteByEmail(user.getEmail());
                    passwordResetRepository.flush();
                }
            } catch (Exception ignored) {}
            try {
                if (emailVerificationRepository != null) {
                    emailVerificationRepository.deleteByEmail(user.getEmail());
                    emailVerificationRepository.flush();
                }
            } catch (Exception ignored) {}
        }

        // 2. Handle followups where therapist or patient is user
        List<com.panchakarma.management.model.FollowUp> followupsPatient = followUpRepository.findByPatientIdOrderByFollowupDateAsc(userId);
        if (!followupsPatient.isEmpty()) {
            followUpRepository.deleteAll(followupsPatient);
        }
        List<com.panchakarma.management.model.FollowUp> followupsTherapist = followUpRepository.findByTherapistIdOrderByFollowupDateAsc(userId);
        for (com.panchakarma.management.model.FollowUp fu : followupsTherapist) {
            fu.setTherapist(null);
            followUpRepository.save(fu);
        }
        followUpRepository.flush();

        // 3. Delete notifications
        List<com.panchakarma.management.model.Notification> notifications = notificationRepository.findByUserOrderByCreatedAtDesc(user);
        if (!notifications.isEmpty()) {
            notificationRepository.deleteAll(notifications);
            notificationRepository.flush();
        }

        // 4. Role-specific deletion
        if (user.getRole() == UserRole.THERAPIST) {
            // Delete schedule & overrides & availability
            List<com.panchakarma.management.model.TherapistWeeklySchedule> schedules = therapistWeeklyScheduleRepository.findByTherapist(user);
            if (!schedules.isEmpty()) {
                therapistWeeklyScheduleRepository.deleteAll(schedules);
                therapistWeeklyScheduleRepository.flush();
            }

            List<com.panchakarma.management.model.TherapistDateOverride> overrides = therapistDateOverrideRepository.findByTherapist(user);
            if (!overrides.isEmpty()) {
                therapistDateOverrideRepository.deleteAll(overrides);
                therapistDateOverrideRepository.flush();
            }

            List<com.panchakarma.management.model.TherapistAvailability> availability = therapistAvailabilityRepository.findByTherapist(user);
            if (!availability.isEmpty()) {
                therapistAvailabilityRepository.deleteAll(availability);
                therapistAvailabilityRepository.flush();
            }

            // Nullify appointments
            if (appointmentRepository != null) {
                try {
                    List<com.panchakarma.management.model.Appointment> appointments = appointmentRepository.findAll().stream()
                            .filter(a -> a.getAssignedTo() != null && a.getAssignedTo().getId().equals(userId))
                            .collect(Collectors.toList());
                    for (com.panchakarma.management.model.Appointment a : appointments) {
                        a.setAssignedTo(null);
                        appointmentRepository.save(a);
                    }
                    appointmentRepository.flush();
                } catch (Exception ignored) {}
            }

            // Nullify bookings
            List<com.panchakarma.management.model.Booking> bookings = bookingRepository.findByAssignedTo_Id(userId);
            for (com.panchakarma.management.model.Booking b : bookings) {
                b.setAssignedTo(null);
                if (b.getTherapistName() == null || b.getTherapistName().equalsIgnoreCase(user.getFullName())) {
                    b.setTherapistName("Former Specialist");
                }
                bookingRepository.save(b);
            }
            bookingRepository.flush();

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
            treatmentPlanRepository.flush();
        } else if (user.getRole() == UserRole.PATIENT) {
            // Delete patient profile
            if (user.getPatient() != null) {
                patientRepository.delete(user.getPatient());
                patientRepository.flush();
            }

            // Delete bookings
            List<com.panchakarma.management.model.Booking> bookings = bookingRepository.findByPatient_Id(userId);
            if (!bookings.isEmpty()) {
                bookingRepository.deleteAll(bookings);
                bookingRepository.flush();
            }

            // Delete treatment plans
            List<com.panchakarma.management.model.TreatmentPlan> plans = treatmentPlanRepository.findByPatient_Id(userId);
            if (!plans.isEmpty()) {
                treatmentPlanRepository.deleteAll(plans);
                treatmentPlanRepository.flush();
            }

            // Delete complaints
            if (user.getPatient() != null) {
                List<com.panchakarma.management.model.Complaint> complaints = complaintRepository.findByPatientId(user.getPatient().getId());
                if (!complaints.isEmpty()) {
                    complaintRepository.deleteAll(complaints);
                    complaintRepository.flush();
                }
            }
        }

        // 5. Finally delete the user & flush
        userRepository.delete(user);
        userRepository.flush();
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
