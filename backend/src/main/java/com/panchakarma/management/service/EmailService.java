package com.panchakarma.management.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    private static final Logger log = LoggerFactory.getLogger(EmailService.class);

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username:}")
    private String fromEmail;

    public EmailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    public void sendBookingReminderEmail(String recipientEmail, String patientName, String bookingDate, String bookingTime, String bookingType, String purpose, String therapistName, String dominantDosha) {
        sendBookingReminderEmail(recipientEmail, patientName, bookingDate, bookingTime, bookingType, purpose, therapistName, dominantDosha, null);
    }

    public void sendBookingReminderEmail(String recipientEmail, String patientName, String bookingDate, String bookingTime, String bookingType, String purpose, String therapistName, String dominantDosha, String patientAdvice) {
        String therapistInfo = therapistName != null ? "Assigned Therapist/Vaidya: " + therapistName : "Assigned Staff: Hospital Care Team";
        String subject = "Reminder: Your Panchakarma Session & Prescribed Diet Plan for Tomorrow";
        String dietAndPreCarePlan = getTherapyDietaryGuidelines(purpose, dominantDosha);
        
        String doctorAdviceSection = (patientAdvice != null && !patientAdvice.isBlank())
                ? "\n====================================================\n" +
                  "🩺 VAIDYA / DOCTOR'S SPECIFIC ADVICE & PRECAUTIONS\n" +
                  "====================================================\n" + patientAdvice + "\n"
                : "";

        String body = String.format("""
            Dear %s,

            This is your daily pre-therapy notification from Panchakarma Management System for your appointment scheduled for tomorrow.

            ====================================================
            📅 APPOINTMENT DETAILS
            ====================================================
            Date: %s
            Time: %s
            Booking Type: %s
            Therapy / Purpose: %s
            %s
            ====================================================

            %s
            %s
            ====================================================
            ⏰ PRE-CLINIC PREPARATION CHECKLIST
            ====================================================
            - Fasting: Do not eat heavy meals within 2 hours of your therapy session.
            - Attire: Wear loose, comfortable cotton clothing.
            - Rest: Ensure 7-8 hours of sound sleep tonight.

            We look forward to hosting your healing session tomorrow.

            Warm regards,
            Panchakarma Ayurvedic Medical Board
            Panchakarma Management Center
            """, patientName, bookingDate, bookingTime, bookingType, purpose != null ? purpose : "Panchakarma Therapy", therapistInfo, dietAndPreCarePlan, doctorAdviceSection);

        log.info("Sending pre-therapy reminder & diet email to: {}", recipientEmail);

        try {
            SimpleMailMessage message = new SimpleMailMessage();
            if (fromEmail != null && !fromEmail.isBlank()) {
                message.setFrom(fromEmail);
            }
            message.setTo(recipientEmail);
            message.setSubject(subject);
            message.setText(body);
            mailSender.send(message);
            log.info("Real email reminder with diet plan successfully sent to {}", recipientEmail);
        } catch (Exception e) {
            log.error("Failed to send real email to {}. Error: {}", recipientEmail, e.getMessage(), e);
            log.info("\n============================================================\n" +
                     "SIMULATED EMAIL CONTENT:\n" +
                     "TO: {}\n" +
                     "SUBJECT: {}\n" +
                     "BODY:\n{}" +
                     "============================================================\n", 
                     recipientEmail, subject, body);
        }
    }

    public void sendPostCareEmail(String recipientEmail, String patientName, String therapyName, String bookingDate, String sessionNotes, String postCareAdvice, String therapistName) {
        String therapistInfo = (therapistName != null && !therapistName.isBlank()) ? "Therapist: " + therapistName : "Panchakarma Care Team";
        String subject = "Post-Care Instructions & Session Summary - " + (therapyName != null ? therapyName : "Panchakarma Therapy");
        String body = String.format("""
            Dear %s,

            Thank you for completing your %s session on %s.

            %s

            Post-Care Instructions & Patient Advice:
            ------------------------------------------------
            %s

            Clinical Observations / Notes:
            ------------------------------------------------
            %s

            ------------------------------------------------
            Please follow the post-care recommendations carefully for optimal recovery and health benefits.
            If you have any questions or experience unusual discomfort, please reach out to our team.

            Warm regards,
            %s
            Panchakarma Management Team
            """,
            patientName != null ? patientName : "Patient",
            therapyName != null ? therapyName : "Panchakarma Therapy",
            bookingDate != null ? bookingDate : "your scheduled date",
            therapistInfo,
            (postCareAdvice != null && !postCareAdvice.isBlank()) ? postCareAdvice : "No specific post-care advice provided.",
            (sessionNotes != null && !sessionNotes.isBlank()) ? sessionNotes : "N/A",
            (therapistName != null && !therapistName.isBlank()) ? therapistName + "\n" : ""
        );

        log.info("Sending post-care email to: {}", recipientEmail);

        try {
            SimpleMailMessage message = new SimpleMailMessage();
            if (fromEmail != null && !fromEmail.isBlank()) {
                message.setFrom(fromEmail);
            }
            message.setTo(recipientEmail);
            message.setSubject(subject);
            message.setText(body);
            mailSender.send(message);
            log.info("Real post-care email successfully sent to {}", recipientEmail);
        } catch (Exception e) {
            log.error("Failed to send real post-care email to {}. Error: {}", recipientEmail, e.getMessage(), e);
            log.info("\n============================================================\n" +
                     "SIMULATED POST-CARE EMAIL CONTENT:\n" +
                     "TO: {}\n" +
                     "SUBJECT: {}\n" +
                     "BODY:\n{}" +
                     "============================================================\n", 
                     recipientEmail, subject, body);
        }
    }

    private String getDoshaGuidelines(String dosha) {
        if (dosha == null) {
            return getFallbackGuidelines();
        }

        switch (dosha.toUpperCase().trim()) {
            case "VATA":
                return """
                    Dosha-Specific Guidelines (Vata Balancing):
                    ------------------------------------------------
                    Recommended Diet Plan:
                    - Focus on warm, cooked, moist, and grounding foods.
                    - Good options: cooked grains (rice, oatmeal), root vegetables, warm soups, ghee, and sweet fruits (bananas, avocados).
                    - Avoid: raw salads, cold drinks, dry snacks (crackers, popcorn), and carbonated beverages.
                    
                    Pre-Clinic Preparation:
                    - Avoid stressful or rushing activities today and tomorrow morning.
                    - Keep warm and hydrated by drinking warm water or ginger tea throughout the day.
                    - Ensure you get a restful night of sleep before your appointment.
                    """;
            case "PITTA":
                return """
                    Dosha-Specific Guidelines (Pitta Balancing):
                    ------------------------------------------------
                    Recommended Diet Plan:
                    - Focus on cooling, refreshing, and moderately substantial foods.
                    - Good options: sweet fruits (melons, grapes), cucumbers, leafy green vegetables, coconut water, and cilantro.
                    - Avoid: excessively spicy, sour, salty, fried, or fermented foods (like pickles, yogurt, or vinegar).
                    
                    Pre-Clinic Preparation:
                    - Stay cool and avoid direct, prolonged exposure to hot sun or intense heat.
                    - Refrain from consuming coffee, alcohol, or other strong stimulants prior to your session.
                    - Keep a calm and relaxed mindset, avoiding strenuous work or competitive environments.
                    """;
            case "KAPHA":
                return """
                    Dosha-Specific Guidelines (Kapha Balancing):
                    ------------------------------------------------
                    Recommended Diet Plan:
                    - Focus on light, warm, dry, and stimulating foods.
                    - Good options: steamed leafy greens, legumes (lentils, mung beans), quinoa, and spices like ginger, black pepper, and mustard seeds.
                    - Avoid: heavy, oily, cold, sweet, or excessively salty foods, and dairy products.
                    
                    Pre-Clinic Preparation:
                    - Avoid daytime napping or sleeping late. Wake up early on the day of your appointment.
                    - Engage in light morning exercise or stretching to stimulate circulation and energy.
                    - Drink warm water with a dash of honey and lemon in the morning.
                    """;
            default:
                // Dual-dosha or Tridosha guidelines
                return """
                    Dosha-Specific Guidelines (Tridosha/Balanced):
                    ------------------------------------------------
                    Recommended Diet Plan:
                    - Focus on a simple, freshly cooked, easily digestible Sattvic diet.
                    - Good options: Kitchari (rice and mung dal cooked together), warm steamed seasonal vegetables, and warm water.
                    - Avoid: processed, canned, heavy, or stale foods, and extremely cold beverages.
                    
                    Pre-Clinic Preparation:
                    - Get 7-8 hours of restful sleep the night before.
                    - Sip warm water throughout the morning to support gentle internal cleansing.
                    - Arrive at the clinic wearing comfortable, loose-fitting clothing to facilitate treatments.
                    """;
        }
    }

    private String getTherapyDietaryGuidelines(String purpose, String dosha) {
        String therapyLower = purpose != null ? purpose.toLowerCase() : "";
        StringBuilder diet = new StringBuilder();

        diet.append("====================================================\n");
        diet.append("🥗 DOCTOR PRESCRIBED DIET PLAN (PATHYA & APATHYA)\n");
        diet.append("====================================================\n");

        if (therapyLower.contains("abhyanga")) {
            diet.append("Therapy Target: Abhyanga (Herbal Oil Massage)\n\n");
            diet.append("✅ WHAT TO INTAKE (Pathya):\n");
            diet.append("  • Sip warm water or mild cumin/ginger tea throughout the day.\n");
            diet.append("  • Eat warm, freshly cooked kitchari, rice gruel, or vegetable soup.\n");
            diet.append("  • Include small amounts of pure cow's ghee in meals.\n\n");
            diet.append("🚫 WHAT NOT TO INTAKE (Apathya):\n");
            diet.append("  • Avoid cold water, iced drinks, or ice cream.\n");
            diet.append("  • Do NOT consume raw salads, heavy meats, or deep-fried foods.\n");
            diet.append("  • Avoid curd (yogurt) and heavy cheese before treatment.\n");
        } else if (therapyLower.contains("shirodhara")) {
            diet.append("Therapy Target: Shirodhara (Oil Pouring Therapy)\n\n");
            diet.append("✅ WHAT TO INTAKE (Pathya):\n");
            diet.append("  • Warm milk with a pinch of turmeric/nutmeg before bed.\n");
            diet.append("  • Lightly cooked grains (oatmeal, rice), warm vegetable broth.\n");
            diet.append("  • Soaked almonds and pumpkin seeds.\n\n");
            diet.append("🚫 WHAT NOT TO INTAKE (Apathya):\n");
            diet.append("  • Avoid caffeinated drinks (coffee, energy drinks, strong tea).\n");
            diet.append("  • Do NOT consume alcohol or tobacco.\n");
            diet.append("  • Avoid heavy, spicy, or pungent meals before treatment.\n");
        } else if (therapyLower.contains("basti")) {
            diet.append("Therapy Target: Basti (Enema & Colon Therapy)\n\n");
            diet.append("✅ WHAT TO INTAKE (Pathya):\n");
            diet.append("  • Light warm rice gruel (Peya) or thin mung dal soup.\n");
            diet.append("  • Warm boiled water only.\n\n");
            diet.append("🚫 WHAT NOT TO INTAKE (Apathya):\n");
            diet.append("  • Fasting or light liquid diet 3 hours prior to procedure.\n");
            diet.append("  • Do NOT consume gas-forming beans, raw vegetables, or heavy fiber.\n");
            diet.append("  • Avoid cold drinks, dairy, and fermented foods.\n");
        } else if (therapyLower.contains("virechana") || therapyLower.contains("purgation")) {
            diet.append("Therapy Target: Virechana (Therapeutic Purgation)\n\n");
            diet.append("✅ WHAT TO INTAKE (Pathya):\n");
            diet.append("  • Warm liquid Samsarjana diet: warm rice water and thin kitchari.\n");
            diet.append("  • Plenty of warm water to prevent dehydration.\n\n");
            diet.append("🚫 WHAT NOT TO INTAKE (Apathya):\n");
            diet.append("  • ABSOLUTELY NO solid heavy food, meat, or fried items.\n");
            diet.append("  • Avoid cold beverages, sweets, or unboiled water.\n");
        } else if (therapyLower.contains("nasya")) {
            diet.append("Therapy Target: Nasya (Nasal Detox Therapy)\n\n");
            diet.append("✅ WHAT TO INTAKE (Pathya):\n");
            diet.append("  • Warm water, herbal teas (tulsi, ginger).\n");
            diet.append("  • Gargle with warm saline water prior to session.\n\n");
            diet.append("🚫 WHAT NOT TO INTAKE (Apathya):\n");
            diet.append("  • Do NOT eat, drink, or brush teeth 1 hour prior to Nasya.\n");
            diet.append("  • Avoid cold drinks, ice cream, and curd.\n");
        } else {
            diet.append("General Panchakarma Therapy Diet Plan\n\n");
            diet.append("✅ WHAT TO INTAKE (Pathya):\n");
            diet.append("  • Warm, freshly cooked, easily digestible Sattvic meals.\n");
            diet.append("  • Warm water, ginger tea, and steamed vegetables.\n\n");
            diet.append("🚫 WHAT NOT TO INTAKE (Apathya):\n");
            diet.append("  • Avoid heavy, oily, spicy, processed, or cold foods.\n");
            diet.append("  • Avoid caffeine, alcohol, and carbonated sodas.\n");
        }

        diet.append("\n").append(getDoshaGuidelines(dosha));
        return diet.toString();
    }

    private String getFallbackGuidelines() {
        return """
            General Pre-Clinic Guidelines:
            ------------------------------------------------
            Recommended Diet Plan:
            - Eat a light, freshly prepared meal 2-3 hours before your appointment.
            - Avoid heavy, oily, spicy, or processed foods.
            
            Pre-Clinic Preparation:
            - Drink plenty of warm water to stay hydrated.
            - Wear loose, comfortable clothing (cotton is preferred).
            - Avoid intense physical exercise, alcohol, and caffeine on the day of your session.
            - Arrive 10 minutes early to relax and settle in.
            """;
    }

    public void sendForgotPasswordEmail(String recipientEmail, String patientName, String code) {
        String subject = "Password Reset OTP Code - Panchakarma Account";
        String body = String.format("""
            Dear %s,
            
            We received a request to reset your password for your Panchakarma Management account.
            
            Your password reset OTP code is:
            %s
            
            Please enter this code in the password reset page to set a new password.
            
            If you did not request a password reset, please ignore this email.
            
            Warm regards,
            Panchakarma Management Team
            """, patientName, code);

        log.info("Sending password reset email to: {}", recipientEmail);

        try {
            SimpleMailMessage message = new SimpleMailMessage();
            setSender(message);
            message.setTo(recipientEmail);
            message.setSubject(subject);
            message.setText(body);
            mailSender.send(message);
            log.info("Password reset email successfully sent to {}", recipientEmail);
        } catch (Exception e) {
            log.error("Failed to send password reset email to {}. Error: {}", recipientEmail, e.getMessage(), e);
            throw new RuntimeException("Failed to send password reset email. Please check the mail configuration and recipient address.", e);
        }
    }

    public void sendVerificationCodeEmail(String recipientEmail, String code) {
        String subject = "Email Verification Code - Panchakarma Account Registration";
        String body = String.format("""
            Dear User,
            
            Thank you for registering with the Panchakarma Management System.
            
            Your email verification code is:
            %s
            
            This code will expire in 10 minutes. Please enter this code in the registration page to complete your signup.
            
            Warm regards,
            Panchakarma Management Team
            """, code);

        log.info("Sending registration verification email to: {}", recipientEmail);

        try {
            SimpleMailMessage message = new SimpleMailMessage();
            setSender(message);
            message.setTo(recipientEmail);
            message.setSubject(subject);
            message.setText(body);
            mailSender.send(message);
            log.info("Verification email successfully sent to {}", recipientEmail);
        } catch (Exception e) {
            log.error("Failed to send verification email to {}. Error: {}", recipientEmail, e.getMessage());
            throw new RuntimeException("Failed to send verification email. Please check if your email address is correct.");
        }
    }

    private void setSender(SimpleMailMessage message) {
        if (fromEmail != null && !fromEmail.isBlank()) {
            message.setFrom(fromEmail.trim());
        }
    }

    /** Notify senior therapist that a new AI suggestion is waiting for review */
    public void sendAiSuggestionPendingEmail(String recipientEmail, String therapistName,
                                              String patientName, Long suggestionId) {
        String subject = "New AI Therapy Suggestion Awaiting Your Review";
        String body = String.format("""
            Dear Dr. %s,

            A new AI-generated therapy suggestion is waiting for your review.

            Patient: %s
            Suggestion ID: #%d

            Please log in to the Panchakarma Management System and go to the
            "AI Therapy Reviews" section on your dashboard to approve, modify, or reject this suggestion.

            Warm regards,
            Panchakarma Management System
            """, therapistName, patientName, suggestionId);

        sendSimpleEmail(recipientEmail, subject, body);
    }

    /** Notify patient that their AI suggestion was approved and booking was created */
    public void sendAiBookingConfirmedEmail(String recipientEmail, String patientName,
                                             String therapyName, String date, String time,
                                             String therapistName, String therapistNotes) {
        String notesSection = (therapistNotes != null && !therapistNotes.isBlank())
                ? "\nDoctor's Notes: " + therapistNotes
                : "";
        String subject = "Your Therapy Has Been Booked — " + therapyName;
        String body = String.format("""
            Dear %s,

            Great news! Our senior Ayurvedic doctor has reviewed your health profile and
            confirmed the following therapy for you:

            ────────────────────────────────────
            Therapy     : %s
            Date        : %s
            Time        : %s
            Therapist   : %s%s
            ────────────────────────────────────

            Your booking is confirmed. Please arrive 10 minutes before your session.

            Warm regards,
            Panchakarma Management Team
            """, patientName, therapyName, date, time, therapistName, notesSection);

        sendSimpleEmail(recipientEmail, subject, body);
    }

    /** Notify patient that their AI suggestion was rejected */
    public void sendAiSuggestionRejectedEmail(String recipientEmail, String patientName, String reason) {
        String subject = "Update on Your Therapy Recommendation Request";
        String body = String.format("""
            Dear %s,

            Thank you for submitting your health details. After careful review, our senior
            Ayurvedic doctor has provided the following feedback:

            Reason: %s

            We recommend you book a direct consultation with one of our therapists
            so they can assess you in person and suggest the most suitable treatment.

            Warm regards,
            Panchakarma Management Team
            """, patientName, reason);

        sendSimpleEmail(recipientEmail, subject, body);
    }

    /** Notify patient that their reschedule request was approved */
    public void sendRescheduleApprovedEmail(String recipientEmail, String patientName,
                                             String bookingType, String newDate, String newTime,
                                             String therapistName) {
        String subject = "Reschedule Approved — Your " + bookingType + " Booking Has Been Moved";
        String body = String.format("""
            Dear %s,

            Great news! Your reschedule request has been approved by %s.

            ────────────────────────────────────
            Updated Booking Details:
            ────────────────────────────────────
            Booking Type  : %s
            New Date      : %s
            New Time      : %s
            Therapist     : %s
            ────────────────────────────────────

            Please make sure to arrive 10 minutes before your new appointment time.

            Warm regards,
            Panchakarma Management Team
            """, patientName, therapistName != null ? therapistName : "your therapist",
                bookingType, newDate, newTime,
                therapistName != null ? therapistName : "Assigned Therapist");

        sendSimpleEmail(recipientEmail, subject, body);
    }

    /** Notify patient that their reschedule was declined with alternative slots to choose from */
    public void sendRescheduleDeclinedWithAlternativesEmail(String recipientEmail, String patientName,
                                                            String bookingType, String originalDate,
                                                            String originalTime, String therapistName,
                                                            String declineReason,
                                                            java.time.LocalDate alt1Date, java.time.LocalTime alt1Time,
                                                            java.time.LocalDate alt2Date, java.time.LocalTime alt2Time,
                                                            java.time.LocalDate alt3Date, java.time.LocalTime alt3Time) {
        String reasonText = (declineReason != null && !declineReason.isBlank())
                ? "Reason: " + declineReason
                : "No specific reason provided.";

        StringBuilder alternatives = new StringBuilder();
        if (alt1Date != null && alt1Time != null) {
            alternatives.append("  ✅ Option 1: ").append(alt1Date).append(" at ").append(alt1Time).append("\n");
        }
        if (alt2Date != null && alt2Time != null) {
            alternatives.append("  ✅ Option 2: ").append(alt2Date).append(" at ").append(alt2Time).append("\n");
        }
        if (alt3Date != null && alt3Time != null) {
            alternatives.append("  ✅ Option 3: ").append(alt3Date).append(" at ").append(alt3Time).append("\n");
        }

        String subject = "Reschedule Update — Alternative Dates Suggested for Your " + bookingType + " Booking";
        String body = String.format("""
            Dear %s,

            Your request to reschedule your %s booking (originally on %s at %s) has been reviewed
            by %s.

            Unfortunately, the requested date/time could not be accommodated.
            %s

            However, your therapist has suggested the following alternative dates for you:

            ────────────────────────────────────
            SUGGESTED ALTERNATIVE SLOTS
            ────────────────────────────────────
            %s
            ────────────────────────────────────

            Please log in to the Panchakarma Management System and select one of the above slots
            that works best for you. If none of the options are suitable, you may cancel the
            booking and rebook at a more convenient time.

            If you need assistance, feel free to contact our clinic reception.

            Warm regards,
            Panchakarma Management Team
            """, patientName, bookingType, originalDate, originalTime,
                therapistName != null ? therapistName : "your therapist",
                reasonText, alternatives.toString());

        sendSimpleEmail(recipientEmail, subject, body);
    }

    public void sendFollowUpConfirmationEmail(String recipientEmail, String patientName, String dateStr, String timeStr, String purposeStr, String therapistName) {
        String subject = "🌿 Follow-up Consultation Scheduled - Panchakarma Recovery Care";
        String body = String.format("""
            Dear %s,

            Your post-treatment follow-up consultation has been successfully scheduled with our Ayurvedic medical team.

            ====================================================
            📅 FOLLOW-UP CONSULTATION DETAILS
            ====================================================
            Date: %s
            Time: %s
            Assigned Vaidya / Therapist: %s
            Purpose / Consultation Track: %s
            ====================================================

            ====================================================
            🌿 POST-TREATMENT & CONSULTATION INSTRUCTIONS
            ====================================================
            1. Recovery & Rest: Continue adhering to your post-treatment dietary guidelines (Samsarjana Krama).
            2. Health Observations: Note down any changes in digestion (Agni), energy levels, sleep, or symptom relief.
            3. Reports & Herbs: Keep your current herbal remedies and clinical reports ready for review during the consultation.

            If you have any questions or need to reschedule, please visit your Panchakarma Patient Portal.

            Warm regards,
            Panchakarma Ayurvedic Medical Care Board
            Panchakarma Management Center
            """, 
            patientName, 
            dateStr, 
            timeStr, 
            therapistName != null ? therapistName : "Ayurvedic Care Team",
            purposeStr != null ? purposeStr : "Routine recovery review and dosha assessment after Panchakarma treatment."
        );

        sendSimpleEmail(recipientEmail, subject, body);
    }

    public void sendFollowUpReminderEmail(String recipientEmail, String patientName, String dateStr, String timeStr, String purposeStr) {
        String subject = "Reminder: Your Follow-up Consultation is Tomorrow";
        String body = String.format("""
            Dear %s,

            Reminder: Your follow-up consultation is tomorrow (%s).

            Please bring any reports or medicines you are currently using.

            Time:
            %s

            Purpose:
            %s

            Warm regards,
            Panchakarma Management Team
            """, patientName, dateStr, timeStr, purposeStr != null ? purposeStr : "Routine recovery review after Panchakarma treatment.");

        sendSimpleEmail(recipientEmail, subject, body);
    }

    public void sendBookingConfirmation(String recipientEmail, String subject, String body) {
        sendSimpleEmail(recipientEmail, subject, body);
    }

    /** Internal helper for plain-text emails */
    public void sendSimpleEmail(String to, String subject, String body) {
        log.info("Sending email to: {} | Subject: {}", to, subject);
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            if (fromEmail != null && !fromEmail.isBlank()) {
                message.setFrom(fromEmail);
            }
            message.setTo(to);
            message.setSubject(subject);
            message.setText(body);
            mailSender.send(message);
            log.info("Email sent successfully to {}", to);
        } catch (Exception e) {
            log.error("Failed to send email to {}. Error: {}", to, e.getMessage());
        }
    }

    public void sendLowStockAlertEmail(String recipientEmail, String medicineName, int currentStock, int minimumThreshold, String supplierName) {
        String subject = "Low Stock Alert – " + medicineName;
        String supplier = supplierName != null && !supplierName.isBlank() ? supplierName : "Ayurvedic Pharmacy Supplier";
        String body = String.format("""
            Hello Pharmacist,

            %s has reached its minimum stock level.

            Current stock: %d
            Minimum threshold: %d
            Supplier: %s

            Please reorder this medicine.

            Warm regards,
            Panchakarma Pharmacy Automated Inventory System
            """, medicineName, currentStock, minimumThreshold, supplier);

        sendSimpleEmail(recipientEmail, subject, body);
    }
}
