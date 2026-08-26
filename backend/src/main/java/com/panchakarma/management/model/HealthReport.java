package com.panchakarma.management.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "health_reports")
public class HealthReport {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long patientId;
    private Integer overallRecovery;
    private Integer doshaHarmony;
    private Integer completedSessions;
    private Integer totalSessions;
    private Integer symptomReduction;

    @Column(length = 1000)
    private String prakritiSummary;

    @Column(length = 1000)
    private String doctorNotes;

    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
    }

    public HealthReport() {}

    public HealthReport(Long patientId, Integer overallRecovery, Integer doshaHarmony, Integer completedSessions, Integer totalSessions, Integer symptomReduction, String prakritiSummary, String doctorNotes) {
        this.patientId = patientId;
        this.overallRecovery = overallRecovery;
        this.doshaHarmony = doshaHarmony;
        this.completedSessions = completedSessions;
        this.totalSessions = totalSessions;
        this.symptomReduction = symptomReduction;
        this.prakritiSummary = prakritiSummary;
        this.doctorNotes = doctorNotes;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getPatientId() { return patientId; }
    public void setPatientId(Long patientId) { this.patientId = patientId; }

    public Integer getOverallRecovery() { return overallRecovery; }
    public void setOverallRecovery(Integer overallRecovery) { this.overallRecovery = overallRecovery; }

    public Integer getDoshaHarmony() { return doshaHarmony; }
    public void setDoshaHarmony(Integer doshaHarmony) { this.doshaHarmony = doshaHarmony; }

    public Integer getCompletedSessions() { return completedSessions; }
    public void setCompletedSessions(Integer completedSessions) { this.completedSessions = completedSessions; }

    public Integer getTotalSessions() { return totalSessions; }
    public void setTotalSessions(Integer totalSessions) { this.totalSessions = totalSessions; }

    public Integer getSymptomReduction() { return symptomReduction; }
    public void setSymptomReduction(Integer symptomReduction) { this.symptomReduction = symptomReduction; }

    public String getPrakritiSummary() { return prakritiSummary; }
    public void setPrakritiSummary(String prakritiSummary) { this.prakritiSummary = prakritiSummary; }

    public String getDoctorNotes() { return doctorNotes; }
    public void setDoctorNotes(String doctorNotes) { this.doctorNotes = doctorNotes; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
