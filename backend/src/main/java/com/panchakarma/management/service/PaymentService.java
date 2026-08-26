package com.panchakarma.management.service;

import com.panchakarma.management.dto.CreateOrderRequest;
import com.panchakarma.management.dto.CreateOrderResponse;
import com.panchakarma.management.dto.VerifyPaymentRequest;

public interface PaymentService {
    CreateOrderResponse createOrder(CreateOrderRequest request);
    Object verifyAndConfirmBooking(VerifyPaymentRequest request);
}
