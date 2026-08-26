package com.panchakarma.management.model;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "prescriptions")
public class Prescription {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long patientId;

    private String patientName;
    private String doctorName;

    // Diagnosis & Chief Complaint
    private String chiefComplaint;
    
    @Column(length = 1000)
    private String clinicalDiagnosis;

    // Panchakarma Therapy Prescription
    private String therapyName; // Abhyanga, Shirodhara, Nasya, Vamana, Virechana, Basti, Pizhichil, Udvartana
    private Integer totalSessions; // e.g. 7
    private String frequency; // Daily, Alternate Days, Weekly
    private String consultationCategory; // NORMAL or THERAPY_RECOMMENDATION

    // Prescribed Medicines list
    @OneToMany(cascade = CascadeType.ALL, mappedBy = "prescription", orphanRemoval = true)
    private List<PrescriptionMedicine> medicines = new ArrayList<>();

    // Advice & Instructions
    @Column(length = 1000)
    private String dietAdvice;

    @Column(length = 1000)
    private String lifestyleAdvice;

    @Column(length = 1000)
    private String postCareInstructions;

    private LocalDate followUpDate;

    // Backward compatibility fields
    private String medicineName;
    private String category;
    private String dosage;
    private String timing;
    private Integer durationDays;
    private Integer daysRemaining;
    private String indication;

    @Column(length = 1000)
    private String practitionerNote;

    private String prescriptionNumber;
    private Boolean dispensed = false;
    private LocalDateTime dispensedAt;
    private String dispensedBy;

    @Column(length = 500)
    private String dispensingNotes;

    private String status; // DRAFT, GENERATED, SENT, ACTIVE, DISPENSED

    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
        if (status == null) {
            status = "GENERATED";
        }
        if (dispensed == null) {
            dispensed = false;
        }
        if (prescriptionNumber == null) {
            prescriptionNumber = "RX-" + (2026) + "-" + String.format("%04d", (int)(Math.random() * 9000 + 1000));
        }
    }

    public Prescription() {}

    public Prescription(Long patientId, String medicineName, String category, String dosage, String timing, Integer durationDays, Integer daysRemaining, String indication, String practitionerNote, String doctorName) {
        this.patientId = patientId;
        this.medicineName = medicineName;
        this.category = category;
        this.dosage = dosage;
        this.timing = timing;
        this.durationDays = durationDays;
        this.daysRemaining = daysRemaining;
        this.indication = indication;
        this.practitionerNote = practitionerNote;
        this.doctorName = doctorName;
        this.status = "ACTIVE";
    }

    public void addMedicine(PrescriptionMedicine medicine) {
        medicines.add(medicine);
        medicine.setPrescription(this);
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getPatientId() { return patientId; }
    public void setPatientId(Long patientId) { this.patientId = patientId; }

    public String getPatientName() { return patientName; }
    public void setPatientName(String patientName) { this.patientName = patientName; }

    public String getDoctorName() { return doctorName; }
    public void setDoctorName(String doctorName) { this.doctorName = doctorName; }

    public String getChiefComplaint() { return chiefComplaint; }
    public void setChiefComplaint(String chiefComplaint) { this.chiefComplaint = chiefComplaint; }

    public String getClinicalDiagnosis() { return clinicalDiagnosis; }
    public void setClinicalDiagnosis(String clinicalDiagnosis) { this.clinicalDiagnosis = clinicalDiagnosis; }

    public String getTherapyName() { return therapyName; }
    public void setTherapyName(String therapyName) { this.therapyName = therapyName; }

    public Integer getTotalSessions() { return totalSessions; }
    public void setTotalSessions(Integer totalSessions) { this.totalSessions = totalSessions; }

    public String getFrequency() { return frequency; }
    public void setFrequency(String frequency) { this.frequency = frequency; }

    public String getConsultationCategory() { return consultationCategory; }
    public void setConsultationCategory(String consultationCategory) { this.consultationCategory = consultationCategory; }

    public List<PrescriptionMedicine> getMedicines() { return medicines; }
    public void setMedicines(List<PrescriptionMedicine> medicines) { 
        this.medicines = medicines;
        if (medicines != null) {
            for (PrescriptionMedicine m : medicines) {
                m.setPrescription(this);
            }
        }
    }

    public String getDietAdvice() { return dietAdvice; }
    public void setDietAdvice(String dietAdvice) { this.dietAdvice = dietAdvice; }

    public String getLifestyleAdvice() { return lifestyleAdvice; }
    public void setLifestyleAdvice(String lifestyleAdvice) { this.lifestyleAdvice = lifestyleAdvice; }

    public String getPostCareInstructions() { return postCareInstructions; }
    public void setPostCareInstructions(String postCareInstructions) { this.postCareInstructions = postCareInstructions; }

    public LocalDate getFollowUpDate() { return followUpDate; }
    public void setFollowUpDate(LocalDate followUpDate) { this.followUpDate = followUpDate; }

    public String getMedicineName() { return medicineName; }
    public void setMedicineName(String medicineName) { this.medicineName = medicineName; }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }

    public String getDosage() { return dosage; }
    public void setDosage(String dosage) { this.dosage = dosage; }

    public String getTiming() { return timing; }
    public void setTiming(String timing) { this.timing = timing; }

    public Integer getDurationDays() { return durationDays; }
    public void setDurationDays(Integer durationDays) { this.durationDays = durationDays; }

    public Integer getDaysRemaining() { return daysRemaining; }
    public void setDaysRemaining(Integer daysRemaining) { this.daysRemaining = daysRemaining; }

    public String getIndication() { return indication; }
    public void setIndication(String indication) { this.indication = indication; }

    public String getPractitionerNote() { return practitionerNote; }
    public void setPractitionerNote(String practitionerNote) { this.practitionerNote = practitionerNote; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getPrescriptionNumber() { return prescriptionNumber; }
    public void setPrescriptionNumber(String prescriptionNumber) { this.prescriptionNumber = prescriptionNumber; }

    public Boolean getDispensed() { return dispensed != null ? dispensed : false; }
    public void setDispensed(Boolean dispensed) { this.dispensed = dispensed; }

    public LocalDateTime getDispensedAt() { return dispensedAt; }
    public void setDispensedAt(LocalDateTime dispensedAt) { this.dispensedAt = dispensedAt; }

    public String getDispensedBy() { return dispensedBy; }
    public void setDispensedBy(String dispensedBy) { this.dispensedBy = dispensedBy; }

    public String getDispensingNotes() { return dispensingNotes; }
    public void setDispensingNotes(String dispensingNotes) { this.dispensingNotes = dispensingNotes; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
