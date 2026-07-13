package com.panchakarma.management.dto;

import com.panchakarma.management.model.UserRole;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record RegisterRequest(
        @NotBlank(message = "Full name is required") String fullName,
        @Email(message = "Enter a valid email") @NotBlank(message = "Email is required") String email,
        @NotBlank(message = "Phone is required")
        @Pattern(regexp = "^[0-9]{10}$", message = "Phone must be 10 digits")
        String phone,
        @Size(min = 6, message = "Password must be at least 6 characters") String password,
        String gender,
        @Min(value = 1, message = "Age must be valid") @Max(value = 120, message = "Age must be valid") Integer age,
        @NotNull(message = "Role is required") UserRole role
) {
}
