package com.apaarsetu.security;

import com.apaarsetu.common.dto.ApiResponse;
import com.apaarsetu.security.filter.ApiKeyAuthFilter;
import com.apaarsetu.security.filter.InstitutionScopeFilter;
import com.apaarsetu.security.filter.JwtAuthenticationFilter;
import com.apaarsetu.security.filter.PasswordChangeEnforcementFilter;
import com.apaarsetu.security.filter.RateLimitFilter;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.time.Instant;
import java.util.Arrays;
import java.util.List;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final RateLimitFilter rateLimitFilter;
    private final ApiKeyAuthFilter apiKeyAuthFilter;
    private final JwtAuthenticationFilter jwtAuthenticationFilter;
    private final PasswordChangeEnforcementFilter passwordChangeEnforcementFilter;
    private final InstitutionScopeFilter institutionScopeFilter;
    private final ObjectMapper objectMapper;

    @Value("${app.cors-origins:http://localhost:3000,http://127.0.0.1:3000}")
    private String[] corsOrigins;

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .csrf(AbstractHttpConfigurer::disable)
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .exceptionHandling(ex -> ex
                        .authenticationEntryPoint((request, response, authException) -> {
                            response.setStatus(HttpStatus.UNAUTHORIZED.value());
                            response.setContentType(MediaType.APPLICATION_JSON_VALUE);
                            ApiResponse<Object> error = ApiResponse.builder()
                                    .success(false)
                                    .message("Authentication required to access this resource")
                                    .errorCode("UNAUTHORIZED")
                                    .code("UNAUTHORIZED")
                                    .timestamp(Instant.now().toString())
                                    .build();
                            objectMapper.writeValue(response.getOutputStream(), error);
                        })
                        .accessDeniedHandler((request, response, accessDeniedException) -> {
                            response.setStatus(HttpStatus.FORBIDDEN.value());
                            response.setContentType(MediaType.APPLICATION_JSON_VALUE);
                            ApiResponse<Object> error = ApiResponse.builder()
                                    .success(false)
                                    .message("You do not have permission to access this resource")
                                    .errorCode("FORBIDDEN")
                                    .code("FORBIDDEN")
                                    .timestamp(Instant.now().toString())
                                    .build();
                            objectMapper.writeValue(response.getOutputStream(), error);
                        })
                )
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                        .requestMatchers(
                                "/auth/login",
                                "/auth/refresh",
                                "/auth/mfa/verify",
                                "/auth/logout",
                                "/enums/**",
                                "/verify/qr/**",
                                "/health",
                                "/actuator/health",
                                "/actuator/health/**",
                                "/actuator/info",
                                "/v3/api-docs/**",
                                "/swagger-ui/**",
                                "/swagger-ui.html"
                        ).permitAll()
                        .requestMatchers("/actuator/**").hasRole("AICTE_ADMIN")
                        .anyRequest().authenticated()
                )
                // Filter execution order:
                // 1. RateLimitFilter
                // 2. ApiKeyAuthFilter
                // 3. JwtAuthenticationFilter
                // 4. PasswordChangeEnforcementFilter
                // 5. InstitutionScopeFilter
                .addFilterBefore(rateLimitFilter, UsernamePasswordAuthenticationFilter.class)
                .addFilterAfter(apiKeyAuthFilter, RateLimitFilter.class)
                .addFilterAfter(jwtAuthenticationFilter, ApiKeyAuthFilter.class)
                .addFilterAfter(passwordChangeEnforcementFilter, JwtAuthenticationFilter.class)
                .addFilterAfter(institutionScopeFilter, PasswordChangeEnforcementFilter.class);

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(Arrays.asList(corsOrigins));
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH", "HEAD"));
        configuration.setAllowedHeaders(List.of(
                "Authorization",
                "Content-Type",
                "Accept",
                "X-API-Key",
                "X-Institution-Id",
                "X-Requested-With",
                "Origin",
                "Cache-Control",
                "Pragma"
        ));
        configuration.setExposedHeaders(List.of(
                "Authorization",
                "Content-Disposition",
                "X-Institution-Id",
                "X-API-Key"
        ));
        configuration.setAllowCredentials(true);
        configuration.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}
