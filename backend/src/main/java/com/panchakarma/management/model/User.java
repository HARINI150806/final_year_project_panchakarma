package com.panchakarma.management.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToOne;
import jakarta.persistence.CascadeType;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import java.time.LocalDateTime;

@Entity
@Table(name = "users")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(mappedBy = "user", cascade = CascadeType.ALL)
    private Patient patient;

    @Column(nullable = false)
    private String fullName;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false)
    private String password;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private UserRole role;

    @Column(nullable = false)
    private String phone;

    private String gender;

    private Integer age;

    private String height;

    private String weight;

    private String occupation;

    private String bodyBuild;

    private String skinType;

    private String appetite;

    private String digestion;

    private String sleepPattern;

    private String energyLevel;

    private String stressResponse;

    private String climatePreference;

    private String walkingStyle;

    private String personality;

    private Integer vataScore;

    private Integer pittaScore;

    private Integer kaphaScore;

    private String dominantDosha;

    private boolean doshaAssessmentCompleted;

    private LocalDateTime doshaAssessmentDate;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    @PrePersist
    void onCreate() {
        createdAt = LocalDateTime.now();
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getFullName() {
        return fullName;
    }

    public void setFullName(String fullName) {
        this.fullName = fullName;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public UserRole getRole() {
        return role;
    }

    public void setRole(UserRole role) {
        this.role = role;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public String getGender() {
        return gender;
    }

    public void setGender(String gender) {
        this.gender = gender;
    }

    public Integer getAge() {
        return age;
    }

    public void setAge(Integer age) {
        this.age = age;
    }

    public String getHeight() {
        return height;
    }

    public void setHeight(String height) {
        this.height = height;
    }

    public String getWeight() {
        return weight;
    }

    public void setWeight(String weight) {
        this.weight = weight;
    }

    public String getOccupation() {
        return occupation;
    }

    public void setOccupation(String occupation) {
        this.occupation = occupation;
    }

    public String getBodyBuild() {
        return bodyBuild;
    }

    public void setBodyBuild(String bodyBuild) {
        this.bodyBuild = bodyBuild;
    }

    public String getSkinType() {
        return skinType;
    }

    public void setSkinType(String skinType) {
        this.skinType = skinType;
    }

    public String getAppetite() {
        return appetite;
    }

    public void setAppetite(String appetite) {
        this.appetite = appetite;
    }

    public String getDigestion() {
        return digestion;
    }

    public void setDigestion(String digestion) {
        this.digestion = digestion;
    }

    public Patient getPatient() {
        return patient;
    }

    public void setPatient(Patient patient) {
        this.patient = patient;
    }

    public String getSleepPattern() {
        return sleepPattern;
    }

    public void setSleepPattern(String sleepPattern) {
        this.sleepPattern = sleepPattern;
    }

    public String getEnergyLevel() {
        return energyLevel;
    }

    public void setEnergyLevel(String energyLevel) {
        this.energyLevel = energyLevel;
    }

    public String getStressResponse() {
        return stressResponse;
    }

    public void setStressResponse(String stressResponse) {
        this.stressResponse = stressResponse;
    }

    public String getClimatePreference() {
        return climatePreference;
    }

    public void setClimatePreference(String climatePreference) {
        this.climatePreference = climatePreference;
    }

    public String getWalkingStyle() {
        return walkingStyle;
    }

    public void setWalkingStyle(String walkingStyle) {
        this.walkingStyle = walkingStyle;
    }

    public String getPersonality() {
        return personality;
    }

    public void setPersonality(String personality) {
        this.personality = personality;
    }

    public Integer getVataScore() {
        return vataScore;
    }

    public void setVataScore(Integer vataScore) {
        this.vataScore = vataScore;
    }

    public Integer getPittaScore() {
        return pittaScore;
    }

    public void setPittaScore(Integer pittaScore) {
        this.pittaScore = pittaScore;
    }

    public Integer getKaphaScore() {
        return kaphaScore;
    }

    public void setKaphaScore(Integer kaphaScore) {
        this.kaphaScore = kaphaScore;
    }

    public String getDominantDosha() {
        return dominantDosha;
    }

    public void setDominantDosha(String dominantDosha) {
        this.dominantDosha = dominantDosha;
    }

    public boolean isDoshaAssessmentCompleted() {
        return doshaAssessmentCompleted;
    }

    public void setDoshaAssessmentCompleted(boolean doshaAssessmentCompleted) {
        this.doshaAssessmentCompleted = doshaAssessmentCompleted;
    }

    public LocalDateTime getDoshaAssessmentDate() {
        return doshaAssessmentDate;
    }

    public void setDoshaAssessmentDate(LocalDateTime doshaAssessmentDate) {
        this.doshaAssessmentDate = doshaAssessmentDate;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}