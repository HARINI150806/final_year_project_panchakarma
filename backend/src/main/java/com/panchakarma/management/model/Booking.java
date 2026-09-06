package com.panchakarma.management.model;

import java.time.LocalDate;
import java.time.LocalTime;

import com.panchakarma.management.model.User;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "bookings")
public class Booking {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long bookingId;

    @ManyToOne
    @JoinColumn(name = "patient_id")
    private User patient;

    @ManyToOne
    @JoinColumn(name = "assigned_to_id")
    private User assignedTo;

    private LocalDate date;
    private LocalTime time;
    private String purpose;

    @Enumerated(EnumType.STRING)
    @Column(name = "type")
    private BookingType bookingType;

    @Enumerated(EnumType.STRING)
    @Column(name = "status")
    private BookingStatus bookingStatus;

    private String patientName;
    private String patientEmail;
    private String therapistName;

    @Column(name = "reminder_sent", nullable = false, columnDefinition = "boolean default false")
    private boolean reminderSent = false;

    @Enumerated(EnumType.STRING)
    @Column(name = "consultation_type")
    private ConsultationType consultationType;

    @Column(name = "consultation_category")
    private String consultationCategory;

    @Column(name = "meet_link")
    private String meetLink;

    @Column(name = "event_id")
    private String eventId;

    /** Specific therapy name (e.g. Abhyanga, Shirodhara) — used for AI-assisted bookings */
    @Column(name = "therapy_name")
    private String therapyName;

    /** Source of booking: MANUAL or AI_ASSISTED */
    @Enumerated(EnumType.STRING)
    @Column(name = "booking_source", nullable = false, columnDefinition = "VARCHAR(255) DEFAULT 'MANUAL'")
    private BookingSource bookingSource = BookingSource.MANUAL;

    /** Foreign key link to parent consultation booking */
    @Column(name = "consultation_booking_id")
    private Long consultationBookingId;

    /** Reference to the AI suggestion that created this booking (null for manual bookings) */
    @Column(name = "ai_suggestion_id")
    private Long aiSuggestionId;

    @Column(name = "session_notes", length = 2000)
    private String sessionNotes;

    @Column(name = "patient_advice", length = 2000)
    private String patientAdvice;

    @Column(name = "reschedule_requested", nullable = false, columnDefinition = "boolean default false")
    private boolean rescheduleRequested = false;

    @Column(name = "proposed_date")
    private LocalDate proposedDate;

    @Column(name = "proposed_time")
    private LocalTime proposedTime;

    @Column(name = "reschedule_reason", length = 1000)
    private String rescheduleReason;

    @Column(name = "decline_reason", length = 500)
    private String declineReason;

    @Column(name = "alt_slots_pending", nullable = false, columnDefinition = "boolean default false")
    private boolean altSlotsPending = false;

    @Column(name = "alt_slot_1_date")
    private LocalDate altSlot1Date;

    @Column(name = "alt_slot_1_time")
    private LocalTime altSlot1Time;

    @Column(name = "alt_slot_2_date")
    private LocalDate altSlot2Date;

    @Column(name = "alt_slot_2_time")
    private LocalTime altSlot2Time;

    @Column(name = "alt_slot_3_date")
    private LocalDate altSlot3Date;

    @Column(name = "alt_slot_3_time")
    private LocalTime altSlot3Time;

    @Column(name = "package_id")
    private String packageId;

    @Column(name = "session_number")
    private Integer sessionNumber;

    @Column(name = "total_sessions")
    private Integer totalSessions;

    @Enumerated(EnumType.STRING)
    @Column(name = "payment_status")
    private PaymentStatus paymentStatus;

    @Column(name = "payment_amount")
    private Double paymentAmount;

    @Column(name = "razorpay_order_id")
    private String razorpayOrderId;

    @Column(name = "razorpay_payment_id")
    private String razorpayPaymentId;

    @Column(name = "razorpay_signature")
    private String razorpaySignature;

    @CreationTimestamp
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;
}