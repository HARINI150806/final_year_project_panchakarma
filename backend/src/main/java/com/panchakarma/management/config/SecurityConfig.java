package com.panchakarma.management.config;

import com.panchakarma.management.security.JwtAuthenticationFilter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
@EnableMethodSecurity
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;
    private final UserDetailsService userDetailsService;

    @Value("${cors.allowed-origins}")
    private String allowedOrigins;

    public SecurityConfig(JwtAuthenticationFilter jwtAuthenticationFilter, UserDetailsService userDetailsService) {
        this.jwtAuthenticationFilter = jwtAuthenticationFilter;
        this.userDetailsService = userDetailsService;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .csrf(csrf -> csrf.disable())
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/api/auth/**", "/api/health", "/api/google/oauth/**", "/ws/**", "/api/public/**").permitAll()
                        .requestMatchers("/api/therapists", "/api/therapists/availability", "/api/therapists/*/availability").authenticated()
                        .requestMatchers(
                            "/api/therapists/my-bookings", 
                            "/api/therapists/my-patients", 
                            "/api/therapists/patients/**",
                            "/api/therapists/weekly-schedule",
                            "/api/therapists/date-overrides",
                            "/api/therapists/date-overrides/**",
                            "/api/therapists/complaints",
                            "/api/therapists/wallet"
                        ).hasAnyAuthority("ROLE_THERAPIST", "ROLE_ADMIN", "THERAPIST", "ADMIN")
                        .requestMatchers("/api/bookings", "/api/bookings/**").authenticated()
                        .requestMatchers("/api/payments", "/api/payments/**").authenticated()
                        .requestMatchers("/api/admin/therapists", "/api/admin/providers").hasAnyAuthority("ROLE_ADMIN")
                        .requestMatchers(
                            "/api/patient/prescriptions",
                            "/api/patient/prescriptions/**",
                            "/api/patient/reports",
                            "/api/patient/reports/**",
                            "/api/prescriptions",
                            "/api/prescriptions/**",
                            "/api/reports",
                            "/api/reports/**"
                        ).authenticated()
                        .requestMatchers("/api/patient/bookings", "/api/patient/book-therapy", "/api/patient/book-consultation", "/api/patient/therapists").hasAnyAuthority("ROLE_PATIENT", "ROLE_ADMIN", "PATIENT", "ADMIN")
                        .requestMatchers("/api/patient/details/**").hasAnyAuthority("ROLE_PATIENT", "ROLE_THERAPIST", "ROLE_ADMIN", "PATIENT", "THERAPIST", "ADMIN")
                        .requestMatchers("/api/patient/complaint", "/api/patient/complaints").hasAnyAuthority("ROLE_PATIENT", "ROLE_THERAPIST", "ROLE_ADMIN", "PATIENT", "THERAPIST", "ADMIN")
                        .requestMatchers("/api/admin/**").hasAnyAuthority("ROLE_ADMIN", "ADMIN")
                        .requestMatchers("/api/medicines", "/api/medicines/**").hasAnyAuthority("ROLE_PHARMACIST", "ROLE_THERAPIST", "ROLE_ADMIN", "PHARMACIST", "THERAPIST", "ADMIN")
                        .requestMatchers("/api/pharmacist/**", "/api/suppliers/**").hasAnyAuthority("ROLE_PHARMACIST", "ROLE_ADMIN", "PHARMACIST", "ADMIN")
                        .requestMatchers("/api/therapist/**").hasAnyAuthority("ROLE_THERAPIST", "ROLE_ADMIN", "THERAPIST", "ADMIN")
                        .requestMatchers("/api/therapists/**").hasAnyAuthority("ROLE_THERAPIST", "ROLE_ADMIN", "ROLE_PATIENT", "THERAPIST", "ADMIN", "PATIENT")
                        .requestMatchers("/api/patient/**").hasAnyAuthority("ROLE_PATIENT", "ROLE_THERAPIST", "ROLE_ADMIN", "PATIENT", "THERAPIST", "ADMIN")
                        // AI-assisted booking endpoints
                        .requestMatchers("/api/ai-booking/suggest", "/api/ai-booking/my-suggestions").hasAnyAuthority("ROLE_PATIENT", "ROLE_ADMIN")
                        .requestMatchers("/api/ai-booking/pending", "/api/ai-booking/*/approve", "/api/ai-booking/*/reject").hasAnyAuthority("ROLE_THERAPIST", "ROLE_ADMIN")
                        .requestMatchers("/api/followups/**", "/api/medical-documents/**").authenticated()
                        .anyRequest().authenticated()
                )
                .authenticationProvider(authenticationProvider())
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public AuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider provider = new DaoAuthenticationProvider();
        provider.setUserDetailsService(userDetailsService);
        provider.setPasswordEncoder(passwordEncoder());
        return provider;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration configuration) throws Exception {
        return configuration.getAuthenticationManager();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(List.of(allowedOrigins.split(",")));
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(List.of("*"));
        configuration.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}