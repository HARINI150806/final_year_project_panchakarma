package com.panchakarma.management.controller;

import com.panchakarma.management.dto.AuthResponse;
import com.panchakarma.management.dto.LoginRequest;
import com.panchakarma.management.dto.RegisterRequest;
import com.panchakarma.management.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @GetMapping("/health")
    public Map<String, String> health() {
        return Map.of("status", "healthy");
    }

    @PostMapping("/auth/send-verification")
    public ResponseEntity<Map<String, String>> sendVerificationCode(@RequestBody Map<String, String> body) {
        String email = body.getOrDefault("email", "");
        if (email.isBlank()) {
            throw new IllegalArgumentException("Email is required");
        }
        String code = authService.sendVerificationCode(email);
        return ResponseEntity.ok(Map.of(
                "message", "Verification code sent successfully to " + email + ".",
                "code", code != null ? code : ""
        ));
    }

    @PostMapping("/auth/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(authService.register(request));
    }

    @PostMapping("/auth/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }

    @PostMapping("/auth/forgot-password")
    public ResponseEntity<Map<String, String>> forgotPassword(@RequestBody Map<String, String> body) {
        String email = body.getOrDefault("email", "");
        authService.forgotPassword(email);
        return ResponseEntity.ok(Map.of(
                "message",
                "A password reset code has been sent to " + email + "."
        ));
    }

    @PostMapping("/auth/reset-password")
    public ResponseEntity<Map<String, String>> resetPassword(@RequestBody Map<String, String> body) {
        String email = body.getOrDefault("email", "");
        String otpCode = body.getOrDefault("otpCode", "");
        String newPassword = body.getOrDefault("newPassword", "");

        if (email.isBlank() || otpCode.isBlank() || newPassword.isBlank()) {
            throw new IllegalArgumentException("Email, verification code, and new password are required.");
        }

        authService.resetPassword(email, otpCode, newPassword);
        return ResponseEntity.ok(Map.of(
                "message",
                "Password has been reset successfully. Please login with your new password."
        ));
    }


    @GetMapping("/auth/verify")
    public ResponseEntity<Map<String, Object>> verifyToken() {
        var auth = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.isAuthenticated() && !(auth instanceof org.springframework.security.authentication.AnonymousAuthenticationToken)) {
            return ResponseEntity.ok(Map.of("valid", true, "username", auth.getName()));
        }
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("valid", false, "message", "Invalid or expired token"));
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, String>> handleIllegalArgument(IllegalArgumentException exception) {
        return ResponseEntity.badRequest().body(Map.of("message", exception.getMessage()));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, String>> handleGenericException(Exception exception) {
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("message", exception.getMessage() != null ? exception.getMessage() : "An unexpected error occurred."));
    }
}
