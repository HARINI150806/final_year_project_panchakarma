package com.panchakarma.management.dto;

import java.util.List;

public record TherapistWalletDto(
    Double totalBalance,
    Double thisMonthEarnings,
    Integer totalPaidConsultations,
    String bankAccountName,
    String bankAccountNumber,
    String bankIfscCode,
    List<WalletTransactionDto> transactions
) {}
