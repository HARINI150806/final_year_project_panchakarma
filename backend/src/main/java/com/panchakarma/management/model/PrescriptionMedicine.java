package com.panchakarma.management.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;

@Entity
@Table(name = "prescription_medicines")
public class PrescriptionMedicine {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "prescription_id")
    @JsonIgnore
    private Prescription prescription;

    private Long medicineId;

    @Column(nullable = false)
    private String medicineName;

    private String form; // Tablet, Powder, Oil, Kashayam, Ghritam, Churna, Capsules
    private Integer quantity; // e.g. 150, 100, 30, 1
    private String unit; // g, ml, tablets, packs
    private String dosage; // e.g. 5 g, 2 tablets, 10 ml
    private String frequency; // Once Daily, Twice Daily, Three Times Daily
    private String duration; // e.g. 15 Days, 30 Days
    private String route; // Oral, Nasal, External

    @Column(length = 500)
    private String instructions; // After food, Before food, With warm water, Before sleep, External use

    public PrescriptionMedicine() {}

    public PrescriptionMedicine(String medicineName, String form, String dosage, String frequency, String duration, String instructions) {
        this.medicineName = medicineName;
        this.form = form;
        this.dosage = dosage;
        this.frequency = frequency;
        this.duration = duration;
        this.instructions = instructions;
    }

    public PrescriptionMedicine(Long medicineId, String medicineName, String form, Integer quantity, String unit, String dosage, String frequency, String duration, String route, String instructions) {
        this.medicineId = medicineId;
        this.medicineName = medicineName;
        this.form = form;
        this.quantity = quantity;
        this.unit = unit;
        this.dosage = dosage;
        this.frequency = frequency;
        this.duration = duration;
        this.route = route;
        this.instructions = instructions;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Prescription getPrescription() { return prescription; }
    public void setPrescription(Prescription prescription) { this.prescription = prescription; }

    public Long getMedicineId() { return medicineId; }
    public void setMedicineId(Long medicineId) { this.medicineId = medicineId; }

    public String getMedicineName() { return medicineName; }
    public void setMedicineName(String medicineName) { this.medicineName = medicineName; }

    public String getForm() { return form; }
    public void setForm(String form) { this.form = form; }

    public Integer getQuantity() { return quantity; }
    public void setQuantity(Integer quantity) { this.quantity = quantity; }

    public String getUnit() { return unit; }
    public void setUnit(String unit) { this.unit = unit; }

    public String getDosage() { return dosage; }
    public void setDosage(String dosage) { this.dosage = dosage; }

    public String getFrequency() { return frequency; }
    public void setFrequency(String frequency) { this.frequency = frequency; }

    public String getDuration() { return duration; }
    public void setDuration(String duration) { this.duration = duration; }

    public String getRoute() { return route; }
    public void setRoute(String route) { this.route = route; }

    public String getInstructions() { return instructions; }
    public void setInstructions(String instructions) { this.instructions = instructions; }
}
