package com.panchakarma.management.dto;

import com.panchakarma.management.model.UserRole;

public record AuthResponse(
        String token,
        Long userId,
        String fullName,
        String email,
        UserRole role
) {
}
