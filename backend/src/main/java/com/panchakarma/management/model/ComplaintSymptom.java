package com.panchakarma.management.model;

import com.panchakarma.management.model.enums.Symptom;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "complaint_symptoms")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ComplaintSymptom {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "complaint_id", nullable = false)
    private Complaint complaint;

    @Enumerated(EnumType.STRING)
    @Column(name = "symptom_name", nullable = false)
    private Symptom symptomName;

    @Column(name = "other_symptom_details")
    private String otherSymptomDetails;
}