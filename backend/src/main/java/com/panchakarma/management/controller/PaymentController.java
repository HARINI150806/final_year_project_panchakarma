package com.panchakarma.management.controller;

import com.panchakarma.management.dto.CreateOrderRequest;
import com.panchakarma.management.dto.CreateOrderResponse;
import com.panchakarma.management.dto.VerifyPaymentRequest;
import com.panchakarma.management.service.PaymentService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/payments")
public class PaymentController {

    @Autowired
    private PaymentService paymentService;

    @PostMapping("/create-order")
    public ResponseEntity<CreateOrderResponse> createOrder(@RequestBody(required = false) CreateOrderRequest request) {
        return ResponseEntity.ok(paymentService.createOrder(request));
    }

    @PostMapping("/verify-and-book")
    public ResponseEntity<Object> verifyAndBook(@Valid @RequestBody VerifyPaymentRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(paymentService.verifyAndConfirmBooking(request));
    }
}
