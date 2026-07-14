package com.panchakarma.management.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "patients")
public class Patient {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String firstName;
    private String lastName;
    private LocalDate dateOfBirth;
    private String gender;
    private String contactNumber;
    private String email;
    private Double height;
    private Double weight;
    private String occupation;

    @OneToOne
    @JoinColumn(name = "user_id", referencedColumnName = "id")
    private User user;

    private boolean profileCompleted;

    private Integer vataScore;
    private Integer pittaScore;
    private Integer kaphaScore;
    private String dominantDosha;
    @Column(nullable = false, columnDefinition = "boolean default false")
    private boolean doshaAssessmentCompleted;
    private LocalDate doshaAssessmentDate;

    @OneToMany(mappedBy = "patient", cascade = CascadeType.ALL, orphanRemoval = true)
    private java.util.List<HealthCondition> healthConditions = new java.util.ArrayList<>();

    @OneToMany(mappedBy = "patient", cascade = CascadeType.ALL, orphanRemoval = true)
    private java.util.List<Allergy> allergies = new java.util.ArrayList<>();

    @OneToMany(mappedBy = "patient", cascade = CascadeType.ALL, orphanRemoval = true)
    private java.util.List<PreviousTreatment> previousTreatments = new java.util.ArrayList<>();
}