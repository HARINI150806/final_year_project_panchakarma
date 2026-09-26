package com.panchakarma.management.service.impl;

import com.panchakarma.management.dto.TreatmentJourneyNodeDto;
import com.panchakarma.management.dto.TreatmentJourneyResponse;
import com.panchakarma.management.dto.TreatmentJourneyResponse.TreatmentCycleDto;
import com.panchakarma.management.exception.ResourceNotFoundException;
import com.panchakarma.management.model.*;
import com.panchakarma.management.repository.*;
import com.panchakarma.management.service.TreatmentJourneyService;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class TreatmentJourneyServiceImpl implements TreatmentJourneyService {

    private final UserRepository userRepository;
    private final BookingRepository bookingRepository;
    private final TreatmentPlanRepository treatmentPlanRepository;
    private final FollowUpRepository followUpRepository;
    private final PatientRepository patientRepository;
    private final RecoveryTrackingRepository recoveryTrackingRepository;
    private final RecoveryPredictionRepository recoveryPredictionRepository;

    public TreatmentJourneyServiceImpl(UserRepository userRepository,
                                       BookingRepository bookingRepository,
                                       TreatmentPlanRepository treatmentPlanRepository,
                                       FollowUpRepository followUpRepository,
                                       PatientRepository patientRepository,
                                       RecoveryTrackingRepository recoveryTrackingRepository,
                                       RecoveryPredictionRepository recoveryPredictionRepository) {
        this.userRepository = userRepository;
        this.bookingRepository = bookingRepository;
        this.treatmentPlanRepository = treatmentPlanRepository;
        this.followUpRepository = followUpRepository;
        this.patientRepository = patientRepository;
        this.recoveryTrackingRepository = recoveryTrackingRepository;
        this.recoveryPredictionRepository = recoveryPredictionRepository;
    }

    @Override
    public TreatmentJourneyResponse getJourneyForPatientUsername(String username) {
        User user = userRepository.findByEmail(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + username));
        return getJourneyForPatient(user.getId());
    }

    @Override
    public TreatmentJourneyResponse getJourneyForPatient(Long patientId) {
        User patientUser = userRepository.findById(patientId)
                .orElseThrow(() -> new ResourceNotFoundException("Patient not found with id: " + patientId));

        Patient profile = patientRepository.findByUser_Id(patientId).orElse(null);

        Set<Booking> bookingSet = new LinkedHashSet<>(bookingRepository.findByPatient_Id(patientId));
        if (patientUser.getEmail() != null && !patientUser.getEmail().isBlank()) {
            bookingSet.addAll(bookingRepository.findByPatientEmail(patientUser.getEmail()));
        }
        List<Booking> allBookings = new ArrayList<>(bookingSet);

        if (allBookings.isEmpty()) {
            return TreatmentJourneyResponse.builder()
                    .hasActiveJourney(false)
                    .isLastJourney(false)
                    .cycles(Collections.emptyList())
                    .nodes(Collections.emptyList())
                    .build();
        }

        Set<TreatmentPlan> planSet = new LinkedHashSet<>(treatmentPlanRepository.findByPatient_Id(patientId));
        List<TreatmentPlan> allPlans = new ArrayList<>(planSet);
        List<FollowUp> allFollowups = followUpRepository.findByPatientIdOrderByFollowupDateAsc(patientId);

        // Sort consultation bookings chronologically (strictly EXCLUDING standalone Normal Consultations)
        List<Booking> consultationBookings = allBookings.stream()
                .filter(b -> !isNormalConsultation(b))
                .filter(b -> b.getBookingType() == BookingType.CONSULTATION || 
                             (b.getPurpose() != null && b.getPurpose().toLowerCase().contains("consultation")) ||
                             (b.getConsultationCategory() != null && !b.getConsultationCategory().isBlank()))
                .sorted(Comparator.comparing(Booking::getDate, Comparator.nullsLast(Comparator.naturalOrder()))
                        .thenComparing(Booking::getBookingId, Comparator.nullsLast(Comparator.naturalOrder())))
                .collect(Collectors.toList());

        Set<Long> consultBookingIds = consultationBookings.stream()
                .map(Booking::getBookingId)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());

        // Sort therapy session bookings chronologically (strictly excluding consultation bookings)
        List<Booking> therapyBookings = allBookings.stream()
                .filter(b -> b.getBookingId() == null || !consultBookingIds.contains(b.getBookingId()))
                .filter(b -> b.getBookingType() != BookingType.CONSULTATION)
                .filter(b -> b.getBookingType() == BookingType.THERAPY ||
                             (b.getTherapyName() != null && !b.getTherapyName().isBlank()) ||
                             (b.getSessionNumber() != null && b.getSessionNumber() > 0))
                .sorted(Comparator.comparing(Booking::getDate, Comparator.nullsLast(Comparator.naturalOrder()))
                        .thenComparing(Booking::getBookingId, Comparator.nullsLast(Comparator.naturalOrder())))
                .collect(Collectors.toList());

        List<TreatmentPlan> sortedPlans = allPlans.stream()
                .sorted(Comparator.comparing(TreatmentPlan::getPrescribedStartDate, Comparator.nullsLast(Comparator.naturalOrder()))
                        .thenComparing(TreatmentPlan::getId, Comparator.nullsLast(Comparator.naturalOrder())))
                .collect(Collectors.toList());

        DateTimeFormatter dateFormatter = DateTimeFormatter.ofPattern("dd MMM yyyy");
        DateTimeFormatter timeFormatter = DateTimeFormatter.ofPattern("hh:mm a");

        String dominantDosha = profile != null && profile.getDominantDosha() != null
                ? profile.getDominantDosha().replace("_", "-")
                : null;

        String primaryDoctorName = resolveDoctorName(consultationBookings.isEmpty() ? null : consultationBookings.get(0), profile, allFollowups, sortedPlans);

        List<TreatmentCycleDto> cycles = new ArrayList<>();

        if (!consultationBookings.isEmpty()) {
            // Build cycles driven by Consultation bookings
            for (int i = 0; i < consultationBookings.size(); i++) {
                Booking consult = consultationBookings.get(i);
                LocalDate consultDate = consult.getDate();
                LocalDate prevConsultDate = (i > 0) ? consultationBookings.get(i - 1).getDate() : null;
                LocalDate nextConsultDate = (i + 1 < consultationBookings.size()) ? consultationBookings.get(i + 1).getDate() : null;

                String consultDateStr = consultDate != null ? consultDate.format(dateFormatter) : LocalDate.now().format(dateFormatter);
                String consultTimeStr = consult.getTime() != null ? consult.getTime().format(timeFormatter) : "10:00 AM";
                String consultTherapist = consult.getAssignedTo() != null ? formatDoctorName(consult.getAssignedTo().getFullName()) : primaryDoctorName;
                String complaint = consult.getPurpose() != null && !consult.getPurpose().isBlank() ? consult.getPurpose() : "Panchakarma Consultation & Evaluation";

                boolean consultDone = getEffectiveBookingStatus(consult) == BookingStatus.COMPLETED || consult.getBookingStatus() == BookingStatus.COMPLETED || (consultDate != null && consultDate.isBefore(LocalDate.now()));

                Booking currentConsult = consult;
                Booking nextConsult = (i + 1 < consultationBookings.size()) ? consultationBookings.get(i + 1) : null;

                // Find corresponding TreatmentPlan prescribed for THIS consultation cycle
                TreatmentPlan matchingPlan = null;
                if (!sortedPlans.isEmpty()) {
                    matchingPlan = sortedPlans.stream()
                            .filter(p -> {
                                if (p == null) return false;
                                if (p.getConsultationBookingId() != null && currentConsult.getBookingId() != null) {
                                    return Objects.equals(p.getConsultationBookingId(), currentConsult.getBookingId());
                                }

                                LocalDate pDate = p.getCreatedAt() != null ? p.getCreatedAt().toLocalDate() : p.getPrescribedStartDate();
                                if (pDate == null) return false;

                                LocalDate targetConsultDate = currentConsult.getDate() != null ? currentConsult.getDate() : (currentConsult.getCreatedAt() != null ? currentConsult.getCreatedAt().toLocalDate() : null);
                                LocalDate consultCreated = currentConsult.getCreatedAt() != null ? currentConsult.getCreatedAt().toLocalDate() : targetConsultDate;
                                
                                if (consultCreated != null && p.getCreatedAt() != null && p.getCreatedAt().toLocalDate().isBefore(consultCreated)) {
                                    return false;
                                }
                                if (targetConsultDate != null && pDate.isBefore(targetConsultDate)) {
                                    return false;
                                }

                                // Check doctor match if consultation has an assigned doctor
                                if (currentConsult.getAssignedTo() != null && p.getPrescribedBy() != null) {
                                    if (!Objects.equals(currentConsult.getAssignedTo().getId(), p.getPrescribedBy().getId())) {
                                        return false;
                                    }
                                }

                                if (nextConsult != null) {
                                    LocalDate nextCreated = nextConsult.getCreatedAt() != null ? nextConsult.getCreatedAt().toLocalDate() : nextConsult.getDate();
                                    if (nextCreated != null && !pDate.isBefore(nextCreated)) return false;
                                }
                                return true;
                            })
                            .findFirst()
                            .orElse(null);
                }

                List<Booking> planSessions = Collections.emptyList();
                if (!therapyBookings.isEmpty()) {
                    planSessions = therapyBookings.stream()
                            .filter(b -> {
                                if (b == null) return false;
                                if (b.getBookingId() != null && b.getBookingId().equals(currentConsult.getBookingId())) return false;

                                if (b.getConsultationBookingId() != null && currentConsult.getBookingId() != null) {
                                    return Objects.equals(b.getConsultationBookingId(), currentConsult.getBookingId());
                                }

                                // Check doctor match if consultation has an assigned doctor
                                if (currentConsult.getAssignedTo() != null && b.getAssignedTo() != null) {
                                    if (!Objects.equals(currentConsult.getAssignedTo().getId(), b.getAssignedTo().getId())) {
                                        return false;
                                    }
                                }

                                // Check lower bound (must be created after currentConsult)
                                if (currentConsult.getBookingId() != null && b.getBookingId() != null) {
                                    if (b.getBookingId() < currentConsult.getBookingId()) return false;
                                } else if (currentConsult.getCreatedAt() != null && b.getCreatedAt() != null) {
                                    if (b.getCreatedAt().isBefore(currentConsult.getCreatedAt())) return false;
                                } else if (currentConsult.getDate() != null) {
                                    LocalDate bDate = b.getDate() != null ? b.getDate() : (b.getCreatedAt() != null ? b.getCreatedAt().toLocalDate() : null);
                                    if (bDate != null && bDate.isBefore(currentConsult.getDate())) return false;
                                }

                                // Check upper bound (must be created before nextConsult if nextConsult exists)
                                if (nextConsult != null) {
                                    if (nextConsult.getBookingId() != null && b.getBookingId() != null) {
                                        if (b.getBookingId() >= nextConsult.getBookingId()) return false;
                                    } else if (nextConsult.getCreatedAt() != null && b.getCreatedAt() != null) {
                                        if (!b.getCreatedAt().isBefore(nextConsult.getCreatedAt())) return false;
                                    } else if (nextConsult.getDate() != null) {
                                        LocalDate bDate = b.getDate() != null ? b.getDate() : (b.getCreatedAt() != null ? b.getCreatedAt().toLocalDate() : null);
                                        if (bDate != null && !bDate.isBefore(nextConsult.getDate())) return false;
                                    }
                                }
                                return true;
                            })
                            .sorted(Comparator.comparing(Booking::getDate, Comparator.nullsLast(Comparator.naturalOrder()))
                                    .thenComparing(Booking::getBookingId, Comparator.nullsLast(Comparator.naturalOrder())))
                            .collect(Collectors.toList());
                }

                int cycleNum = cycles.size() + 1;
                List<TreatmentJourneyNodeDto> cycleNodes = new ArrayList<>();
                int eventOrder = 1;

                // STEP 1: Consultation
                cycleNodes.add(TreatmentJourneyNodeDto.builder()
                        .id("cycle-" + cycleNum + "-node-1")
                        .type("CONSULTATION")
                        .title("Consultation")
                        .date(consultDateStr)
                        .time(consultTimeStr)
                        .assignedTherapist(consultTherapist)
                        .status(consultDone ? "COMPLETED" : "ACTIVE")
                        .chiefComplaint(complaint)
                        .eventOrder(eventOrder++)
                        .cycleNumber(cycleNum)
                        .build());

                // STEP 2: Prescribed Therapy Plan
                if (matchingPlan != null) {
                    String thName = matchingPlan.getTherapyName() != null && !matchingPlan.getTherapyName().isBlank() ? matchingPlan.getTherapyName() : "Panchakarma Therapy";
                    int totalSess = matchingPlan.getTotalSessions() != null ? Math.max(1, matchingPlan.getTotalSessions()) : 3;
                    String planDateStr = matchingPlan.getCreatedAt() != null 
                            ? matchingPlan.getCreatedAt().toLocalDate().format(dateFormatter) 
                            : (matchingPlan.getPrescribedStartDate() != null ? matchingPlan.getPrescribedStartDate().format(dateFormatter) : consultDateStr);
                    String planTherapist = matchingPlan.getAssignedTherapist() != null ? formatDoctorName(matchingPlan.getAssignedTherapist().getFullName()) : consultTherapist;

                    int completedSess = (int) planSessions.stream().filter(b -> getEffectiveBookingStatus(b) == BookingStatus.COMPLETED).count();

                    if (!planSessions.isEmpty()) {
                        for (Booking b : planSessions) {
                            if (b.getTotalSessions() != null && b.getTotalSessions() > 0) {
                                totalSess = b.getTotalSessions();
                                break;
                            }
                        }
                    }

                    boolean hasBookedSessions = !planSessions.isEmpty();
                    boolean allBookedCompleted = hasBookedSessions && planSessions.stream().allMatch(b -> getEffectiveBookingStatus(b) == BookingStatus.COMPLETED);
                    boolean isPlanDone = (totalSess > 0 && hasBookedSessions && completedSess >= totalSess) || allBookedCompleted;
                    if (allBookedCompleted && completedSess > 0) {
                        totalSess = completedSess;
                    }
                    int remainingSess = Math.max(0, totalSess - completedSess);

                    Booking latestDone = planSessions.stream().filter(b -> getEffectiveBookingStatus(b) == BookingStatus.COMPLETED).reduce((a, b) -> b).orElse(null);
                    Booking nextSched = planSessions.stream().filter(b -> getEffectiveBookingStatus(b) == BookingStatus.CONFIRMED || getEffectiveBookingStatus(b) == BookingStatus.PENDING).findFirst().orElse(null);

                    String latestDateStr = latestDone != null && latestDone.getDate() != null ? latestDone.getDate().format(dateFormatter) : null;
                    String latestTimeStr = latestDone != null && latestDone.getTime() != null ? latestDone.getTime().format(timeFormatter) : null;
                    String firstSessStr = hasBookedSessions && planSessions.get(0).getDate() != null 
                            ? planSessions.get(0).getDate().format(dateFormatter) 
                            : "Not Booked Yet";
                    String nextDateStr = nextSched != null && nextSched.getDate() != null ? nextSched.getDate().format(dateFormatter) : (hasBookedSessions ? firstSessStr : "Not Booked Yet");
                    String nextTimeStr = nextSched != null && nextSched.getTime() != null ? nextSched.getTime().format(timeFormatter) : null;

                    boolean isProgressDone = isPlanDone;
                    boolean isProgressActive = !isProgressDone && hasBookedSessions && (completedSess > 0 || nextSched != null);

                    // STEP 2: Therapy Plan
                    cycleNodes.add(TreatmentJourneyNodeDto.builder()
                            .id("cycle-" + cycleNum + "-node-2")
                            .type("THERAPY_PLAN")
                            .title("Therapy Plan")
                            .therapyName(thName)
                            .totalSessions(totalSess)
                            .planCreatedDate(planDateStr)
                            .firstSessionDate(firstSessStr)
                            .assignedTherapist(planTherapist)
                            .status(isPlanDone ? "COMPLETED" : (hasBookedSessions ? "BOOKED" : "PRESCRIBED"))
                            .eventOrder(eventOrder++)
                            .cycleNumber(cycleNum)
                            .build());

                    // STEP 3: Therapy Progress
                    cycleNodes.add(TreatmentJourneyNodeDto.builder()
                            .id("cycle-" + cycleNum + "-node-3")
                            .type("THERAPY_PROGRESS")
                            .title("Therapy Progress")
                            .therapyName(thName)
                            .completedSessions(completedSess)
                            .totalSessions(totalSess)
                            .remainingSessions(remainingSess)
                            .latestCompletedSessionDate(latestDateStr)
                            .latestCompletedSessionTime(latestTimeStr)
                            .nextScheduledSessionDate(nextDateStr)
                            .nextScheduledSessionTime(nextTimeStr)
                            .assignedTherapist(planTherapist)
                            .status(isProgressDone ? "COMPLETED" : (isProgressActive ? "ACTIVE" : "PENDING"))
                            .eventOrder(eventOrder++)
                            .cycleNumber(cycleNum)
                            .build());

                    // STEP 4: Recovery Assessment
                    RecoveryMetrics metrics1 = getSavedRecoveryMetrics(
                            matchingPlan != null ? matchingPlan.getId() : null,
                            patientId,
                            isProgressDone,
                            completedSess,
                            isProgressDone ? "Therapy completed successfully." : (hasBookedSessions ? "Patient responding to treatment." : "Therapy plan prescribed by " + planTherapist + ". Awaiting patient therapy session booking.")
                    );

                    cycleNodes.add(TreatmentJourneyNodeDto.builder()
                            .id("cycle-" + cycleNum + "-node-4")
                            .type("RECOVERY")
                            .title("Recovery Assessment")
                            .currentRecoveryPercent(metrics1.currentRec)
                            .predictedRecoveryPercent(metrics1.predRec)
                            .recoveryStatus(metrics1.status)
                            .recoveryPlanNotes("Active Samsarjana Krama diet & lifestyle guidelines.")
                            .therapistRemarks(metrics1.remarks)
                            .status(isProgressDone ? "COMPLETED" : (isProgressActive ? "ACTIVE" : "PENDING"))
                            .eventOrder(eventOrder++)
                            .cycleNumber(cycleNum)
                            .build());

                } else {
                    if (!planSessions.isEmpty()) {
                        // Direct therapy sessions booked
                        Booking firstSession = planSessions.get(0);
                        String reqTherapy = firstSession.getTherapyName() != null && !firstSession.getTherapyName().isBlank()
                                ? firstSession.getTherapyName()
                                : (firstSession.getPurpose() != null && !firstSession.getPurpose().isBlank()
                                        ? firstSession.getPurpose()
                                        : "Panchakarma Therapy");

                        int completedSess = (int) planSessions.stream().filter(b -> getEffectiveBookingStatus(b) == BookingStatus.COMPLETED).count();
                        int totalSess = firstSession.getTotalSessions() != null && firstSession.getTotalSessions() > 0 
                                ? firstSession.getTotalSessions() 
                                : planSessions.size();
                        for (Booking b : planSessions) {
                            if (b.getTotalSessions() != null && b.getTotalSessions() > 0) {
                                totalSess = b.getTotalSessions();
                                break;
                            }
                        }

                        boolean hasBookedSessions = !planSessions.isEmpty();
                        boolean allBookedCompleted = hasBookedSessions && planSessions.stream().allMatch(b -> getEffectiveBookingStatus(b) == BookingStatus.COMPLETED);
                        boolean isPlanDone = (totalSess > 0 && hasBookedSessions && completedSess >= totalSess) || allBookedCompleted;
                        if (allBookedCompleted && completedSess > 0) {
                            totalSess = completedSess;
                        }
                        boolean isProgressActive = !isPlanDone && hasBookedSessions && (completedSess > 0 || planSessions.stream().anyMatch(b -> getEffectiveBookingStatus(b) == BookingStatus.CONFIRMED || getEffectiveBookingStatus(b) == BookingStatus.PENDING));

                        String planCreatedDateStr = firstSession.getCreatedAt() != null 
                                ? firstSession.getCreatedAt().toLocalDate().format(dateFormatter) 
                                : consultDateStr;
                        String firstSessionDateStr = firstSession.getDate() != null 
                                ? firstSession.getDate().format(dateFormatter) 
                                : "Not Booked Yet";
                        String sessionTherapist = firstSession.getAssignedTo() != null 
                                ? formatDoctorName(firstSession.getAssignedTo().getFullName()) 
                                : consultTherapist;

                        Booking latestDone = planSessions.stream().filter(b -> getEffectiveBookingStatus(b) == BookingStatus.COMPLETED).reduce((a, b) -> b).orElse(null);
                        Booking nextSched = planSessions.stream().filter(b -> getEffectiveBookingStatus(b) == BookingStatus.CONFIRMED || getEffectiveBookingStatus(b) == BookingStatus.PENDING).findFirst().orElse(null);

                        String latestDateStr = latestDone != null && latestDone.getDate() != null ? latestDone.getDate().format(dateFormatter) : null;
                        String latestTimeStr = latestDone != null && latestDone.getTime() != null ? latestDone.getTime().format(timeFormatter) : null;
                        String nextDateStr = nextSched != null && nextSched.getDate() != null ? nextSched.getDate().format(dateFormatter) : firstSessionDateStr;
                        String nextTimeStr = nextSched != null && nextSched.getTime() != null ? nextSched.getTime().format(timeFormatter) : null;

                        String planStatus = isPlanDone ? "COMPLETED" : (hasBookedSessions ? "BOOKED" : "PRESCRIBED");

                        cycleNodes.add(TreatmentJourneyNodeDto.builder()
                                .id("cycle-" + cycleNum + "-node-2")
                                .type("THERAPY_PLAN")
                                .title("Therapy Plan")
                                .therapyName(reqTherapy)
                                .totalSessions(totalSess)
                                .planCreatedDate(planCreatedDateStr)
                                .firstSessionDate(nextDateStr)
                                .assignedTherapist(sessionTherapist)
                                .status(planStatus)
                                .eventOrder(eventOrder++)
                                .cycleNumber(cycleNum)
                                .build());

                        cycleNodes.add(TreatmentJourneyNodeDto.builder()
                                .id("cycle-" + cycleNum + "-node-3")
                                .type("THERAPY_PROGRESS")
                                .title("Therapy Progress")
                                .therapyName(reqTherapy)
                                .completedSessions(completedSess)
                                .totalSessions(totalSess)
                                .remainingSessions(Math.max(0, totalSess - completedSess))
                                .latestCompletedSessionDate(latestDateStr)
                                .latestCompletedSessionTime(latestTimeStr)
                                .nextScheduledSessionDate(nextDateStr)
                                .nextScheduledSessionTime(nextTimeStr)
                                .assignedTherapist(sessionTherapist)
                                .status(isPlanDone ? "COMPLETED" : (isProgressActive ? "ACTIVE" : "PENDING"))
                                .eventOrder(eventOrder++)
                                .cycleNumber(cycleNum)
                                .build());

                        RecoveryMetrics metrics2 = getSavedRecoveryMetrics(
                                null,
                                patientId,
                                isPlanDone,
                                completedSess,
                                isPlanDone ? "Therapy completed successfully." : (hasBookedSessions ? "Patient responding to treatment." : "Awaiting patient therapy session booking.")
                        );

                        cycleNodes.add(TreatmentJourneyNodeDto.builder()
                                .id("cycle-" + cycleNum + "-node-4")
                                .type("RECOVERY")
                                .title("Recovery Assessment")
                                .currentRecoveryPercent(metrics2.currentRec)
                                .predictedRecoveryPercent(metrics2.predRec)
                                .recoveryStatus(metrics2.status)
                                .recoveryPlanNotes("Diet & herbal recommendations following consultation.")
                                .therapistRemarks(metrics2.remarks)
                                .status(isPlanDone ? "COMPLETED" : (isProgressActive ? "ACTIVE" : "PENDING"))
                                .eventOrder(eventOrder++)
                                .cycleNumber(cycleNum)
                                .build());
                    } else {
                        // Consultation is active/upcoming, no therapy plan prescribed by doctor yet
                        String reqTherapy = (consult.getTherapyName() != null && !consult.getTherapyName().isBlank())
                                ? consult.getTherapyName()
                                : (hasDirectTherapyInfo(consult) ? consult.getPurpose() : null);

                        boolean hasReqTherapy = reqTherapy != null && !reqTherapy.isBlank();
                        String displayTherapyName = hasReqTherapy ? reqTherapy : "Pending Recommendation";
                        int defaultTotal = consult.getTotalSessions() != null && consult.getTotalSessions() > 0 ? consult.getTotalSessions() : (hasReqTherapy ? 3 : 0);

                        cycleNodes.add(TreatmentJourneyNodeDto.builder()
                                .id("cycle-" + cycleNum + "-node-2")
                                .type("THERAPY_PLAN")
                                .title("Therapy Plan")
                                .therapyName(displayTherapyName)
                                .totalSessions(defaultTotal)
                                .planCreatedDate(consultDateStr)
                                .firstSessionDate("Not Booked Yet")
                                .assignedTherapist(consultTherapist)
                                .status(hasReqTherapy ? "PRESCRIBED" : "PENDING")
                                .eventOrder(eventOrder++)
                                .cycleNumber(cycleNum)
                                .build());

                        cycleNodes.add(TreatmentJourneyNodeDto.builder()
                                .id("cycle-" + cycleNum + "-node-3")
                                .type("THERAPY_PROGRESS")
                                .title("Therapy Progress")
                                .therapyName(hasReqTherapy ? displayTherapyName : "Pending Therapy")
                                .completedSessions(0)
                                .totalSessions(defaultTotal)
                                .remainingSessions(defaultTotal)
                                .nextScheduledSessionDate("Not Booked Yet")
                                .assignedTherapist(consultTherapist)
                                .status("PENDING")
                                .eventOrder(eventOrder++)
                                .cycleNumber(cycleNum)
                                .build());

                        RecoveryMetrics metrics3 = getSavedRecoveryMetrics(
                                null,
                                patientId,
                                false,
                                0,
                                hasReqTherapy 
                                        ? "Therapy requested (" + displayTherapyName + "). Awaiting doctor evaluation and session booking." 
                                        : "Consultation in progress. Doctor will prescribe treatment plan after evaluation."
                        );

                        cycleNodes.add(TreatmentJourneyNodeDto.builder()
                                .id("cycle-" + cycleNum + "-node-4")
                                .type("RECOVERY")
                                .title("Recovery Assessment")
                                .currentRecoveryPercent(metrics3.currentRec)
                                .predictedRecoveryPercent(metrics3.predRec)
                                .recoveryStatus(metrics3.status)
                                .recoveryPlanNotes(hasReqTherapy ? "Diet & lifestyle recommendations following consultation." : "Awaiting doctor consultation and assessment.")
                                .therapistRemarks(metrics3.remarks)
                                .status("PENDING")
                                .eventOrder(eventOrder++)
                                .cycleNumber(cycleNum)
                                .build());
                    }
                }

                int cycleCompletedCount = (int) cycleNodes.stream().filter(n -> "COMPLETED".equalsIgnoreCase(n.getStatus())).count();
                int cycleProgress = (cycleCompletedCount == cycleNodes.size()) ? 100 : Math.min(100, Math.round(((float) cycleCompletedCount / (float) cycleNodes.size()) * 100f));
                if (consultDone && cycleCompletedCount == 1) cycleProgress = 25;

                boolean isCurrentCycle = (i == consultationBookings.size() - 1);

                String cycleTherapyName = matchingPlan != null && matchingPlan.getTherapyName() != null && !matchingPlan.getTherapyName().isBlank() 
                        ? matchingPlan.getTherapyName() 
                        : (consult.getTherapyName() != null && !consult.getTherapyName().isBlank() 
                                ? consult.getTherapyName() 
                                : "Pending Recommendation");

                cycles.add(TreatmentCycleDto.builder()
                        .cycleNumber(cycleNum)
                        .cycleName("Treatment Cycle " + cycleNum)
                        .displayTitle(complaint + " (" + consultDateStr + ")")
                        .chiefComplaint(complaint)
                        .therapyName(cycleTherapyName)
                        .hasFollowup(false)
                        .isCurrentCycle(isCurrentCycle)
                        .nodes(cycleNodes)
                        .progressPercent(cycleProgress)
                        .build());
            }

            if (!cycles.isEmpty()) {
                TreatmentCycleDto lastCycle = cycles.get(cycles.size() - 1);
                cycles.set(cycles.size() - 1, TreatmentCycleDto.builder()
                        .cycleNumber(lastCycle.getCycleNumber())
                        .cycleName(lastCycle.getCycleName())
                        .displayTitle(lastCycle.getDisplayTitle())
                        .chiefComplaint(lastCycle.getChiefComplaint())
                        .therapyName(lastCycle.getTherapyName())
                        .hasFollowup(lastCycle.isHasFollowup())
                        .isCurrentCycle(true)
                        .nodes(lastCycle.getNodes())
                        .progressPercent(lastCycle.getProgressPercent())
                        .build());
            }
        }
        
        if (cycles.isEmpty() && !sortedPlans.isEmpty()) {
            // Fallback for plans without explicit consultation bookings
            int cycleIndex = 1;
            for (TreatmentPlan plan : sortedPlans) {
                String thName = plan.getTherapyName() != null ? plan.getTherapyName() : "Panchakarma Therapy";
                int totalSess = plan.getTotalSessions() != null ? Math.max(1, plan.getTotalSessions()) : 3;
                String planDateStr = plan.getPrescribedStartDate() != null ? plan.getPrescribedStartDate().format(dateFormatter) : LocalDate.now().format(dateFormatter);
                String planTherapist = plan.getAssignedTherapist() != null ? formatDoctorName(plan.getAssignedTherapist().getFullName()) : primaryDoctorName;

                // Find sessions belonging to this plan
                List<Booking> planSessions = therapyBookings.stream()
                        .filter(b -> (b.getConsultationBookingId() != null && Objects.equals(b.getConsultationBookingId(), plan.getConsultationBookingId())) ||
                                     (b.getPackageId() != null && Objects.equals(b.getPackageId(), plan.getPackageId())))
                        .collect(Collectors.toList());

                int completedSess = (int) planSessions.stream().filter(b -> getEffectiveBookingStatus(b) == BookingStatus.COMPLETED).count();
                boolean isPlanDone = "COMPLETED".equalsIgnoreCase(plan.getStatus()) || (totalSess > 0 && completedSess >= totalSess);
                boolean isProgressActive = !isPlanDone && (completedSess > 0 || !planSessions.isEmpty());

                List<TreatmentJourneyNodeDto> cycleNodes = new ArrayList<>();
                int eventOrder = 1;

                cycleNodes.add(TreatmentJourneyNodeDto.builder()
                        .id("plan-cycle-" + cycleIndex + "-node-1")
                        .type("CONSULTATION")
                        .title("Consultation")
                        .date(planDateStr)
                        .time("10:00 AM")
                        .assignedTherapist(planTherapist)
                        .status("COMPLETED")
                        .chiefComplaint(plan.getClinicalNotes() != null ? plan.getClinicalNotes() : "Clinical Consultation")
                        .eventOrder(eventOrder++)
                        .cycleNumber(cycleIndex)
                        .build());

                cycleNodes.add(TreatmentJourneyNodeDto.builder()
                        .id("plan-cycle-" + cycleIndex + "-node-2")
                        .type("THERAPY_PLAN")
                        .title("Therapy Plan")
                        .therapyName(thName)
                        .totalSessions(totalSess)
                        .planCreatedDate(planDateStr)
                        .firstSessionDate(!planSessions.isEmpty() && planSessions.get(0).getDate() != null ? planSessions.get(0).getDate().format(dateFormatter) : "Not Booked Yet")
                        .assignedTherapist(planTherapist)
                        .status(isPlanDone ? "COMPLETED" : (!planSessions.isEmpty() ? "BOOKED" : "PRESCRIBED"))
                        .eventOrder(eventOrder++)
                        .cycleNumber(cycleIndex)
                        .build());

                cycleNodes.add(TreatmentJourneyNodeDto.builder()
                        .id("plan-cycle-" + cycleIndex + "-node-3")
                        .type("THERAPY_PROGRESS")
                        .title("Therapy Progress")
                        .therapyName(thName)
                        .completedSessions(completedSess)
                        .totalSessions(totalSess)
                        .remainingSessions(Math.max(0, totalSess - completedSess))
                        .assignedTherapist(planTherapist)
                        .status(isPlanDone ? "COMPLETED" : (isProgressActive ? "ACTIVE" : "PENDING"))
                        .eventOrder(eventOrder++)
                        .cycleNumber(cycleIndex)
                        .build());

                RecoveryMetrics metrics4 = getSavedRecoveryMetrics(
                        plan.getId(),
                        patientId,
                        isPlanDone,
                        completedSess,
                        isPlanDone ? "Therapy completed successfully." : (!planSessions.isEmpty() ? "Patient responding to treatment." : "Therapy plan prescribed by " + planTherapist + ". Awaiting patient therapy session booking.")
                );

                cycleNodes.add(TreatmentJourneyNodeDto.builder()
                        .id("plan-cycle-" + cycleIndex + "-node-4")
                        .type("RECOVERY")
                        .title("Recovery Assessment")
                        .currentRecoveryPercent(metrics4.currentRec)
                        .predictedRecoveryPercent(metrics4.predRec)
                        .recoveryStatus(metrics4.status)
                        .recoveryPlanNotes("Active Samsarjana Krama diet & lifestyle guidelines.")
                        .therapistRemarks(metrics4.remarks)
                        .status(isPlanDone ? "COMPLETED" : (isProgressActive ? "ACTIVE" : "PENDING"))
                        .eventOrder(eventOrder++)
                        .cycleNumber(cycleIndex)
                        .build());

                int cycleProgress = isPlanDone ? 100 : (25 + Math.round(((float) completedSess / (float) totalSess) * 75f));

                cycles.add(TreatmentCycleDto.builder()
                        .cycleNumber(cycleIndex)
                        .cycleName("Treatment Cycle " + cycleIndex)
                        .displayTitle(thName + " (" + planDateStr + ")")
                        .chiefComplaint("Clinical Evaluation")
                        .therapyName(thName)
                        .hasFollowup(false)
                        .isCurrentCycle(cycleIndex == sortedPlans.size())
                        .nodes(cycleNodes)
                        .progressPercent(cycleProgress)
                        .build());
                cycleIndex++;
            }
        }

        if (cycles.isEmpty()) {
            return TreatmentJourneyResponse.builder()
                    .hasActiveJourney(false)
                    .isLastJourney(false)
                    .cycles(Collections.emptyList())
                    .nodes(Collections.emptyList())
                    .build();
        }

        // Select ongoing active cycle (< 100% progress), or fallback to the most recent completed cycle
        TreatmentCycleDto selectedCycle = cycles.stream()
                .filter(c -> c.getProgressPercent() < 100)
                .reduce((first, second) -> second)
                .orElse(cycles.get(cycles.size() - 1));

        boolean isShowingLastJourney = (selectedCycle.getProgressPercent() >= 100);
        cycles = Collections.singletonList(selectedCycle);
        TreatmentCycleDto activeCycle = selectedCycle;
        List<TreatmentJourneyNodeDto> activeNodes = activeCycle.getNodes();

        boolean activeFound = false;
        int completedCount = 0;

        for (TreatmentJourneyNodeDto node : activeNodes) {
            if ("COMPLETED".equalsIgnoreCase(node.getStatus()) || isShowingLastJourney) {
                completedCount++;
                node.setIsCurrentActive(false);
            } else if (!activeFound && ("ACTIVE".equalsIgnoreCase(node.getStatus()) || "BOOKED".equalsIgnoreCase(node.getStatus()) || "PRESCRIBED".equalsIgnoreCase(node.getStatus()))) {
                node.setIsCurrentActive(true);
                activeFound = true;
            } else {
                node.setIsCurrentActive(false);
            }
        }

        if (!activeFound && !isShowingLastJourney) {
            for (TreatmentJourneyNodeDto node : activeNodes) {
                if ("PENDING".equalsIgnoreCase(node.getStatus())) {
                    node.setIsCurrentActive(true);
                    activeFound = true;
                    break;
                }
            }
        }

        int totalCount = activeNodes.size();
        int progressPercent = isShowingLastJourney ? 100 : 0;
        if (!isShowingLastJourney && totalCount > 0) {
            long compCount = activeNodes.stream().filter(n -> "COMPLETED".equalsIgnoreCase(n.getStatus())).count();
            if (compCount >= totalCount) {
                progressPercent = 100;
            } else {
                float baseProgress = ((float) compCount / (float) totalCount) * 100f;
                TreatmentJourneyNodeDto progressNode = activeNodes.stream()
                        .filter(n -> "THERAPY_PROGRESS".equalsIgnoreCase(n.getType()))
                        .findFirst().orElse(null);
                if (progressNode != null && "ACTIVE".equalsIgnoreCase(progressNode.getStatus()) && progressNode.getTotalSessions() > 0) {
                    float sessionFraction = (float) progressNode.getCompletedSessions() / (float) progressNode.getTotalSessions();
                    baseProgress += (sessionFraction * (100f / totalCount));
                }
                progressPercent = Math.min(100, Math.round(baseProgress));
            }
        }

        String currentActiveStageTitle = isShowingLastJourney
                ? "Last Treatment Journey (Completed)"
                : activeNodes.stream()
                        .filter(n -> Boolean.TRUE.equals(n.getIsCurrentActive()))
                        .findFirst()
                        .map(TreatmentJourneyNodeDto::getTitle)
                        .orElse("Treatment Completed");

        return TreatmentJourneyResponse.builder()
                .hasActiveJourney(true)
                .isLastJourney(isShowingLastJourney)
                .cycles(cycles)
                .nodes(activeNodes)
                .activeCycleNumber(activeCycle.getCycleNumber())
                .completedNodesCount(completedCount)
                .totalNodesCount(totalCount)
                .progressPercent(progressPercent)
                .currentActiveStageTitle(currentActiveStageTitle)
                .patientName(patientUser.getFullName())
                .dominantDosha(dominantDosha)
                .build();
    }

    private String resolveDoctorName(Booking primaryConsult, Patient profile, List<FollowUp> followups, List<TreatmentPlan> plans) {
        if (primaryConsult != null && primaryConsult.getAssignedTo() != null) {
            return formatDoctorName(primaryConsult.getAssignedTo().getFullName());
        }
        if (!followups.isEmpty() && followups.get(0).getTherapist() != null) {
            return formatDoctorName(followups.get(0).getTherapist().getFullName());
        }
        if (!plans.isEmpty() && plans.get(0).getPrescribedBy() != null) {
            return formatDoctorName(plans.get(0).getPrescribedBy().getFullName());
        }
        return "Dr. Harini";
    }

    private boolean isNormalConsultation(Booking b) {
        if (b == null) return false;
        if ("NORMAL".equalsIgnoreCase(b.getConsultationCategory())) {
            return true;
        }
        if (b.getPurpose() != null && b.getPurpose().toLowerCase().contains("normal consultation")) {
            return true;
        }
        return false;
    }

    private boolean isConsultationWithTherapy(Booking consult) {
        if (consult == null) return false;
        
        // If explicitly NORMAL consultation (or purpose contains normal consultation), it's a standalone normal consultation
        if ("NORMAL".equalsIgnoreCase(consult.getConsultationCategory())) {
            return false;
        }
        if (consult.getPurpose() != null && consult.getPurpose().toLowerCase().contains("normal consultation")) {
            return false;
        }
        
        // If consultation category is THERAPY_RECOMMENDATION or non-NORMAL, it is Consultation with Therapy
        if (consult.getConsultationCategory() != null && !consult.getConsultationCategory().isBlank() && !"NORMAL".equalsIgnoreCase(consult.getConsultationCategory())) {
            return true;
        }
        
        return hasDirectTherapyInfo(consult);
    }

    private boolean hasDirectTherapyInfo(Booking consult) {
        if (consult == null) return false;
        if (consult.getTherapyName() != null && !consult.getTherapyName().isBlank()) {
            return true;
        }
        if (consult.getPurpose() != null && !consult.getPurpose().isBlank()) {
            String purpose = consult.getPurpose().toLowerCase();
            if (purpose.contains("abhyanga") || purpose.contains("shirodhara") ||
                purpose.contains("virechana") || purpose.contains("basti") ||
                purpose.contains("nasya") || purpose.contains("udvartana") ||
                purpose.contains("vamana") || purpose.contains("raktamokshana")) {
                return true;
            }
        }
        return false;
    }

    private BookingStatus getEffectiveBookingStatus(Booking b) {
        if (b == null) return BookingStatus.PENDING;
        BookingStatus status = b.getBookingStatus();
        if (status != BookingStatus.CANCELLED && status != BookingStatus.COMPLETED && b.getDate() != null && b.getTime() != null) {
            try {
                java.time.LocalDateTime bookingDateTime = b.getDate().atTime(b.getTime());
                if (java.time.LocalDateTime.now().isAfter(bookingDateTime)) {
                    return BookingStatus.COMPLETED;
                }
            } catch (Exception ignored) {}
        }
        return status != null ? status : BookingStatus.CONFIRMED;
    }

    private String formatDoctorName(String name) {
        if (name == null || name.isBlank()) return "Ayurvedic Specialist";
        String clean = name.trim();
        if (clean.toLowerCase().startsWith("dr.") || clean.toLowerCase().startsWith("dr ") || clean.toLowerCase().startsWith("therapist")) {
            return clean;
        }
        return "Dr. " + clean;
    }

    private static class RecoveryMetrics {
        final Double currentRec;
        final Double predRec;
        final String status;
        final String remarks;

        RecoveryMetrics(Double currentRec, Double predRec, String status, String remarks) {
            this.currentRec = currentRec;
            this.predRec = predRec;
            this.status = status;
            this.remarks = remarks;
        }
    }

    private RecoveryMetrics getSavedRecoveryMetrics(Long planId, Long patientId, boolean isProgressDone, int completedSess, String defaultRemarks) {
        RecoveryTracking tracking = null;
        if (planId != null) {
            tracking = recoveryTrackingRepository.findFirstByTreatmentPlanIdOrderBySessionNumberDesc(planId).orElse(null);
        }
        if (tracking == null && patientId != null) {
            List<RecoveryTracking> trackings = recoveryTrackingRepository.findByPatientIdOrderByAssessmentDateDesc(patientId);
            if (!trackings.isEmpty()) tracking = trackings.get(0);
        }

        RecoveryPrediction prediction = null;
        if (planId != null) {
            prediction = recoveryPredictionRepository.findFirstByTreatmentPlanIdOrderByPredictionDateDesc(planId).orElse(null);
        }
        if (prediction == null && patientId != null) {
            List<RecoveryPrediction> predictions = recoveryPredictionRepository.findByPatientIdOrderByPredictionDateDesc(patientId);
            if (!predictions.isEmpty()) prediction = predictions.get(0);
        }

        Double currentRec = isProgressDone ? 100.0 : (completedSess > 0 ? Math.min(85.0, 20.0 + completedSess * 20.0) : 0.0);
        Double predRec = isProgressDone ? 100.0 : 85.0;
        String status = isProgressDone ? "Fully Recovered" : (completedSess > 0 ? "Improving" : "Pending");
        String remarks = defaultRemarks;

        if (tracking != null && tracking.getCurrentRecoveryPercentage() != null) {
            currentRec = tracking.getCurrentRecoveryPercentage();
            if (tracking.getTherapistRemarks() != null && !tracking.getTherapistRemarks().isBlank()) {
                remarks = tracking.getTherapistRemarks();
            }
        }

        if (prediction != null) {
            if (prediction.getPredictedRecovery() != null) {
                predRec = prediction.getPredictedRecovery();
            }
            if (prediction.getStatus() != null && !prediction.getStatus().isBlank()) {
                status = prediction.getStatus();
            }
        }

        return new RecoveryMetrics(currentRec, predRec, status, remarks);
    }
}
