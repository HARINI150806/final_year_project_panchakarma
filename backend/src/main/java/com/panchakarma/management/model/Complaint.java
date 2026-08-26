package com.panchakarma.management.model;

import com.panchakarma.management.model.enums.*;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "complaints")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Complaint {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "patient_id", nullable = false)
    private Patient patient;

    @Enumerated(EnumType.STRING)
    @Column(name = "main_complaint", nullable = false)
    private MainComplaint mainComplaint;

    @Column(name = "other_complaint")
    private String otherComplaint;

    @Enumerated(EnumType.STRING)
    @Column(name = "body_area")
    private BodyArea bodyArea;

    @Column(name = "other_body_area")
    private String otherBodyArea;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private com.panchakarma.management.model.enums.Severity severity;

    @Column(name = "duration_value")
    private Integer durationValue;

    @Enumerated(EnumType.STRING)
    @Column(name = "duration_unit")
    private com.panchakarma.management.model.enums.DurationUnit durationUnit;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private com.panchakarma.management.model.enums.Frequency frequency;

    @Column(name = "pain_level")
    private Integer painLevel;

    @Lob
    @Column(name = "additional_details")
    private String additionalDetails;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ComplaintStatus status;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @OneToMany(mappedBy = "complaint", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ComplaintSymptom> symptoms;
}