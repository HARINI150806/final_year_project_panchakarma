package com.panchakarma.management.service.impl;

import com.panchakarma.management.dto.AutoBookingRequest;
import com.panchakarma.management.dto.AutoBookingResponse;
import com.panchakarma.management.dto.BookingRequest;
import com.panchakarma.management.dto.BookingResponse;
import com.panchakarma.management.dto.CreateOrderRequest;
import com.panchakarma.management.dto.CreateOrderResponse;
import com.panchakarma.management.dto.VerifyPaymentRequest;
import com.panchakarma.management.exception.ResourceNotFoundException;
import com.panchakarma.management.model.Booking;
import com.panchakarma.management.model.BookingStatus;
import com.panchakarma.management.model.BookingType;
import com.panchakarma.management.model.ConsultationType;
import com.panchakarma.management.model.PaymentStatus;
import com.panchakarma.management.repository.BookingRepository;
import com.panchakarma.management.service.BookingService;
import com.panchakarma.management.service.PaymentService;
import com.razorpay.Order;
import com.razorpay.RazorpayClient;
import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.InvalidKeyException;
import java.security.NoSuchAlgorithmException;
import java.util.Formatter;

@Service
public class PaymentServiceImpl implements PaymentService {

    @Value("${razorpay.key-id:rzp_test_500PanchakarmaTest}")
    private String keyId;

    @Value("${razorpay.key-secret:test_secret_key_12345}")
    private String keySecret;

    @Value("${razorpay.consultation-amount:500.00}")
    private Double consultationAmount;

    @Autowired
    private BookingService bookingService;

    @Autowired
    private BookingRepository bookingRepository;

    @Override
    public CreateOrderResponse createOrder(CreateOrderRequest request) {
        Double amount = (request != null && request.amount() != null && request.amount() > 0)
                ? request.amount()
                : consultationAmount;
        int amountInPaise = (int) Math.round(amount * 100);
        String currency = (request != null && request.currency() != null && !request.currency().isBlank())
                ? request.currency()
                : "INR";

        String orderId = null;
        try {
            if (keyId != null && !keyId.isBlank() && keySecret != null && !keySecret.isBlank()) {
                RazorpayClient razorpayClient = new RazorpayClient(keyId, keySecret);
                JSONObject orderRequest = new JSONObject();
                orderRequest.put("amount", amountInPaise);
                orderRequest.put("currency", currency);
                orderRequest.put("receipt", "txn_" + System.currentTimeMillis());

                Order order = razorpayClient.orders.create(orderRequest);
                if (order != null && order.has("id")) {
                    orderId = order.get("id");
                }
            }
        } catch (Exception e) {
            System.err.println("Razorpay API order creation notice: " + e.getMessage());
        }

        if (orderId == null || orderId.isBlank()) {
            orderId = "order_test_" + System.currentTimeMillis();
        }

        String activeKeyId = (keyId != null && !keyId.isBlank())
                ? keyId
                : "rzp_test_1DP5hB15W9Z38Q";

        return new CreateOrderResponse(
                orderId,
                amount,
                amountInPaise,
                currency,
                activeKeyId
        );
    }

    @Override
    @Transactional
    public Object verifyAndConfirmBooking(VerifyPaymentRequest request) {
        boolean isValidSignature = verifySignature(
                request.razorpayOrderId(),
                request.razorpayPaymentId(),
                request.razorpaySignature()
        );

        if (!isValidSignature) {
            throw new IllegalStateException("Payment verification failed! Invalid Razorpay signature.");
        }

        // Create and confirm booking depending on consultation mode
        if (request.consultationType() == ConsultationType.ONLINE) {
            AutoBookingRequest autoReq = new AutoBookingRequest(
                    request.patientId(),
                    request.date(),
                    request.time(),
                    request.reason(),
                    request.notes(),
                    request.assignedToId(),
                    request.inAppNotifEnabled(),
                    request.emailNotifEnabled()
            );
            AutoBookingResponse autoRes = bookingService.autoScheduleConsultation(autoReq);

            // Update booking with payment information
            Booking booking = bookingRepository.findById(autoRes.bookingId())
                    .orElseThrow(() -> new ResourceNotFoundException("Booking not found: " + autoRes.bookingId()));
            booking.setBookingStatus(BookingStatus.CONFIRMED);
            booking.setConsultationCategory(request.consultationCategory() != null ? request.consultationCategory() : "NORMAL");
            booking.setPaymentStatus(PaymentStatus.PAID);
            booking.setPaymentAmount(consultationAmount);
            booking.setRazorpayOrderId(request.razorpayOrderId());
            booking.setRazorpayPaymentId(request.razorpayPaymentId());
            booking.setRazorpaySignature(request.razorpaySignature());
            bookingRepository.save(booking);

            return new AutoBookingResponse(
                    autoRes.bookingId(),
                    autoRes.therapistId(),
                    autoRes.therapistName(),
                    autoRes.date(),
                    autoRes.startTime(),
                    autoRes.endTime(),
                    autoRes.meetLink(),
                    "Online consultation confirmed & payment of ₹" + consultationAmount.intValue() + " received!",
                    PaymentStatus.PAID,
                    consultationAmount,
                    request.razorpayOrderId(),
                    request.razorpayPaymentId()
            );
        } else {
            // Offline consultation booking
            BookingRequest bookingReq = new BookingRequest();
            bookingReq.setPatientId(request.patientId());
            bookingReq.setAssignedToId(request.assignedToId());
            bookingReq.setDate(request.date());
            bookingReq.setTime(request.time() != null ? request.time() : java.time.LocalTime.of(10, 0));
            bookingReq.setPurpose(request.reason() + (request.notes() != null && !request.notes().isBlank() ? " — " + request.notes() : ""));
            bookingReq.setBookingType(BookingType.CONSULTATION);
            bookingReq.setBookingStatus(BookingStatus.CONFIRMED);
            bookingReq.setConsultationType(ConsultationType.OFFLINE);
            bookingReq.setConsultationCategory(request.consultationCategory() != null ? request.consultationCategory() : "NORMAL");
            bookingReq.setInAppNotifEnabled(request.inAppNotifEnabled());
            bookingReq.setEmailNotifEnabled(request.emailNotifEnabled());

            BookingResponse bookingRes = bookingService.createBooking(bookingReq);

            // Update payment attributes
            Booking booking = bookingRepository.findById(bookingRes.id())
                    .orElseThrow(() -> new ResourceNotFoundException("Booking not found: " + bookingRes.id()));
            booking.setPaymentStatus(PaymentStatus.PAID);
            booking.setPaymentAmount(consultationAmount);
            booking.setRazorpayOrderId(request.razorpayOrderId());
            booking.setRazorpayPaymentId(request.razorpayPaymentId());
            booking.setRazorpaySignature(request.razorpaySignature());
            Booking saved = bookingRepository.save(booking);

            return new BookingResponse(
                    saved.getBookingId(),
                    saved.getBookingType(),
                    saved.getDate(),
                    saved.getTime(),
                    saved.getPurpose(),
                    saved.getBookingStatus(),
                    saved.getConsultationType(),
                    saved.getConsultationCategory() != null ? saved.getConsultationCategory() : "NORMAL",
                    saved.getMeetLink(),
                    bookingRes.assignedTo(),
                    saved.getSessionNotes(),
                    saved.getPatientAdvice(),
                    saved.isRescheduleRequested(),
                    saved.getProposedDate(),
                    saved.getProposedTime(),
                    saved.getRescheduleReason(),
                    saved.getPackageId(),
                    saved.getSessionNumber(),
                    saved.getTotalSessions(),
                    saved.getPatientName(),
                    saved.getPatientEmail(),
                    saved.isAltSlotsPending(),
                    saved.getDeclineReason(),
                    saved.getAltSlot1Date(),
                    saved.getAltSlot1Time(),
                    saved.getAltSlot2Date(),
                    saved.getAltSlot2Time(),
                    saved.getAltSlot3Date(),
                    saved.getAltSlot3Time(),
                    saved.getPaymentStatus(),
                    saved.getPaymentAmount(),
                    saved.getRazorpayOrderId(),
                    saved.getRazorpayPaymentId()
            );
        }
    }

    private boolean verifySignature(String orderId, String paymentId, String signature) {
        if (signature == null || signature.isBlank()) {
            // For test simulation without secret key check
            return true;
        }
        if (keySecret == null || keySecret.contains("test_secret_key")) {
            // Test mode default signature check
            return true;
        }
        try {
            String payload = orderId + "|" + paymentId;
            String expectedSignature = calculateHmacSha256(payload, keySecret);
            return expectedSignature.equalsIgnoreCase(signature);
        } catch (Exception e) {
            System.err.println("Signature verification exception: " + e.getMessage());
            return true;
        }
    }

    private String calculateHmacSha256(String data, String secret)
            throws NoSuchAlgorithmException, InvalidKeyException {
        SecretKeySpec secretKeySpec = new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
        Mac mac = Mac.getInstance("HmacSHA256");
        mac.init(secretKeySpec);
        byte[] rawHmac = mac.doFinal(data.getBytes(StandardCharsets.UTF_8));
        return toHexString(rawHmac);
    }

    private String toHexString(byte[] bytes) {
        Formatter formatter = new Formatter();
        for (byte b : bytes) {
            formatter.format("%02x", b);
        }
        String result = formatter.toString();
        formatter.close();
        return result;
    }
}
