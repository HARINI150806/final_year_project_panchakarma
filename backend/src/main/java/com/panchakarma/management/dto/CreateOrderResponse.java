package com.panchakarma.management.dto;

public record CreateOrderResponse(
    String orderId,
    Double amount,
    Integer amountInPaise,
    String currency,
    String keyId
) {}
