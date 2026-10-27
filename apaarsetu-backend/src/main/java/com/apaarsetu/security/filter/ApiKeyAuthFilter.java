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
import org.bson.Document;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Instant;
import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class ApiKeyAuthFilter extends OncePerRequestFilter {

    private final MongoTemplate mongoTemplate;
    private final PasswordEncoder passwordEncoder;
    private final ObjectMapper objectMapper;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {

        String apiKeyHeader = request.getHeader("X-API-Key");
        if (apiKeyHeader == null || apiKeyHeader.isBlank()) {
            String authHeader = request.getHeader("Authorization");
            if (authHeader != null && authHeader.startsWith("ApiKey ")) {
                apiKeyHeader = authHeader.substring(7).trim();
            }
        }

        if (apiKeyHeader != null && !apiKeyHeader.isBlank()) {
            String keyId;
            String secret;

            if (apiKeyHeader.contains(".")) {
                int dotIndex = apiKeyHeader.indexOf('.');
                keyId = apiKeyHeader.substring(0, dotIndex);
                secret = apiKeyHeader.substring(dotIndex + 1);
            } else if (apiKeyHeader.contains(":")) {
                int colonIndex = apiKeyHeader.indexOf(':');
                keyId = apiKeyHeader.substring(0, colonIndex);
                secret = apiKeyHeader.substring(colonIndex + 1);
            } else {
                sendUnauthorized(response, "Invalid API key format. Expected <keyId>.<secret>");
                return;
            }

            // Look up institution containing this ERP key
            Query query = new Query(Criteria.where("erpApiKeys")
                    .elemMatch(Criteria.where("keyId").is(keyId).and("active").is(true)));
            Document instDoc = mongoTemplate.findOne(query, Document.class, "institutions");

            if (instDoc == null) {
                log.warn("ERP API key '{}' not found or inactive", keyId);
                sendUnauthorized(response, "Invalid or inactive ERP API key");
                return;
            }

            @SuppressWarnings("unchecked")
            List<Document> keys = (List<Document>) instDoc.get("erpApiKeys");
            Document matchingKey = null;
            if (keys != null) {
                for (Document k : keys) {
                    if (keyId.equals(k.getString("keyId")) && Boolean.TRUE.equals(k.getBoolean("active"))) {
                        matchingKey = k;
                        break;
                    }
                }
            }

            if (matchingKey == null || !passwordEncoder.matches(secret, matchingKey.getString("keyHash"))) {
                log.warn("ERP API key '{}' secret verification failed", keyId);
                sendUnauthorized(response, "Invalid ERP API key credentials");
                return;
            }

            // Update lastUsed timestamp on the key asynchronously in MongoDB
            String aicteId = instDoc.getString("aicteId");
            try {
                Query updateQuery = new Query(Criteria.where("aicteId").is(aicteId)
                        .and("erpApiKeys.keyId").is(keyId));
                Update update = new Update().set("erpApiKeys.$.lastUsed", Instant.now().toString());
                mongoTemplate.updateFirst(updateQuery, update, "institutions");
            } catch (Exception e) {
                log.warn("Failed to update ERP key lastUsed timestamp: {}", e.getMessage());
            }

            UserPrincipal principal = UserPrincipal.builder()
                    .id("erp-" + keyId)
                    .email("erp-" + keyId + "@" + aicteId)
                    .fullName("ERP Client (" + keyId + ")")
                    .role("ROLE_ERP_CLIENT")
                    .institutionId(aicteId)
                    .status("ACTIVE")
                    .build();

            UsernamePasswordAuthenticationToken authentication =
                    new UsernamePasswordAuthenticationToken(principal, null, principal.getAuthorities());
            SecurityContextHolder.getContext().setAuthentication(authentication);
            log.debug("Authenticated ERP client for institution {}", aicteId);
        }

        filterChain.doFilter(request, response);
    }

    private void sendUnauthorized(HttpServletResponse response, String message) throws IOException {
        response.setStatus(HttpStatus.UNAUTHORIZED.value());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        ApiResponse<Object> error = ApiResponse.builder()
                .success(false)
                .message(message)
                .errorCode("UNAUTHORIZED")
                .code("UNAUTHORIZED")
                .timestamp(Instant.now().toString())
                .build();
        objectMapper.writeValue(response.getOutputStream(), error);
    }
}
