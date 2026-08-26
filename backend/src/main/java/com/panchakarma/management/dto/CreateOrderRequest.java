package com.panchakarma.management.dto;

public record CreateOrderRequest(
    Double amount,
    String currency
) {}
