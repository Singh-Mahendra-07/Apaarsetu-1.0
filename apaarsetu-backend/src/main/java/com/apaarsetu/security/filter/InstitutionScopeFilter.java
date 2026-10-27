package com.apaarsetu.security.filter;

import com.apaarsetu.common.dto.ApiResponse;
import com.apaarsetu.security.UserPrincipal;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Instant;
import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class InstitutionScopeFilter extends OncePerRequestFilter {

    private final ObjectMapper objectMapper;

    private static final List<String> VERIFIER_ALLOWED_PREFIXES = List.of(
            "/verify",
            "/auth",
            "/enums",
            "/profile",
            "/health",
            "/actuator",
            "/v3/api-docs",
            "/swagger-ui"
    );

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();

        if (auth != null && auth.getPrincipal() instanceof UserPrincipal principal) {
            String role = principal.getRole();
            String servletPath = request.getServletPath();
            if (servletPath == null || servletPath.isEmpty()) {
                servletPath = request.getRequestURI();
            }

            // 1. Authorized Verifier Role Isolation
            if ("ROLE_AUTHORIZED_VERIFIER".equalsIgnoreCase(role)) {
                boolean allowed = false;
                for (String prefix : VERIFIER_ALLOWED_PREFIXES) {
                    if (servletPath.contains(prefix)) {
                        allowed = true;
                        break;
                    }
                }
                if (!allowed) {
                    log.warn("Authorized Verifier blocked from accessing path: {}", servletPath);
                    sendForbidden(response, "Authorized verifiers are restricted to verification and reference endpoints only.");
                    return;
                }
            }

            // 2. Tenant Isolation for Institution Roles
            if ("ROLE_INSTITUTION_ADMIN".equalsIgnoreCase(role)
                    || "ROLE_INSTITUTION_OPERATOR".equalsIgnoreCase(role)
                    || "ROLE_ERP_CLIENT".equalsIgnoreCase(role)) {

                String myInstId = principal.getInstitutionId();
                if (myInstId != null && !myInstId.isBlank()) {
                    // Check if path is targeted at /institutions/{id}/...
                    if (servletPath.contains("/institutions/")) {
                        String afterPrefix = servletPath.substring(servletPath.indexOf("/institutions/") + "/institutions/".length());
                        String targetInstId = afterPrefix.split("/")[0].split("\\?")[0];

                        // If accessing a specific institution ID different from own institutionId
                        if (!targetInstId.isBlank() && !targetInstId.equalsIgnoreCase(myInstId)) {
                            log.warn("Tenant isolation violation: User from '{}' attempted access to institution '{}'", myInstId, targetInstId);
                            sendForbidden(response, "Access denied: Cross-institution access prohibited.");
                            return;
                        }
                    }
                }
            }
        }

        filterChain.doFilter(request, response);
    }

    private void sendForbidden(HttpServletResponse response, String message) throws IOException {
        response.setStatus(HttpStatus.FORBIDDEN.value());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        ApiResponse<Object> error = ApiResponse.builder()
                .success(false)
                .message(message)
                .errorCode("FORBIDDEN")
                .code("FORBIDDEN")
                .timestamp(Instant.now().toString())
                .build();
        objectMapper.writeValue(response.getOutputStream(), error);
    }
}
