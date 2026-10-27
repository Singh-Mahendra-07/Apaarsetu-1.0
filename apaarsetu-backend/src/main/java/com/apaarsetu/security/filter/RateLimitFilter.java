package com.apaarsetu.security.filter;

import com.apaarsetu.common.dto.ApiResponse;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import io.github.bucket4j.Refill;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.bson.Document;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Duration;
import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Slf4j
@Component
@RequiredArgsConstructor
public class RateLimitFilter extends OncePerRequestFilter {

    private final MongoTemplate mongoTemplate;
    private final ObjectMapper objectMapper;

    @Value("${app.rate-limit.requests-per-minute:1000}")
    private int defaultRequestsPerMinute;

    @Value("${app.rate-limit.verification-per-minute:200}")
    private int defaultVerificationPerMinute;

    @Value("${app.rate-limit.trust-proxy:false}")
    private boolean trustProxy;

    private static final int MAX_BUCKETS = 50_000;
    private final ConcurrentHashMap<String, BucketEntry> generalBuckets = new ConcurrentHashMap<>();
    private final ConcurrentHashMap<String, BucketEntry> verificationBuckets = new ConcurrentHashMap<>();
    private final java.util.concurrent.atomic.AtomicBoolean isCleaningGeneral = new java.util.concurrent.atomic.AtomicBoolean(false);
    private final java.util.concurrent.atomic.AtomicBoolean isCleaningVerification = new java.util.concurrent.atomic.AtomicBoolean(false);

    private record BucketEntry(Bucket bucket, long lastAccessEpochSeconds) {}

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {

        // Skip rate limiting for OPTIONS preflight requests
        if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
            filterChain.doFilter(request, response);
            return;
        }

        String path = request.getRequestURI();
        boolean isVerify = path.contains("/verify");
        String clientIp = getClientIp(request);
        long now = Instant.now().getEpochSecond();

        Bucket bucket;
        if (isVerify) {
            evictIfOverCapacity(verificationBuckets, isCleaningVerification);
            BucketEntry entry = verificationBuckets.compute(clientIp, (k, old) ->
                    new BucketEntry(old != null ? old.bucket() : createVerificationBucket(clientIp), now));
            bucket = entry.bucket();
        } else {
            evictIfOverCapacity(generalBuckets, isCleaningGeneral);
            BucketEntry entry = generalBuckets.compute(clientIp, (k, old) ->
                    new BucketEntry(old != null ? old.bucket() : createGeneralBucket(clientIp), now));
            bucket = entry.bucket();
        }

        if (bucket.tryConsume(1)) {
            filterChain.doFilter(request, response);
        } else {
            log.warn("Rate limit exceeded for IP: {} on URI: {}", clientIp, path);
            response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
            response.setHeader("Retry-After", "60");
            response.setContentType(MediaType.APPLICATION_JSON_VALUE);

            ApiResponse<Object> errorResponse = ApiResponse.builder()
                    .success(false)
                    .message("Rate limit exceeded. Please try again after 60 seconds.")
                    .errorCode("RATE_LIMIT_EXCEEDED")
                    .code("RATE_LIMIT_EXCEEDED")
                    .data(Map.of("code", "RATE_LIMIT_EXCEEDED", "retryAfterSeconds", 60))
                    .timestamp(Instant.now().toString())
                    .build();

            objectMapper.writeValue(response.getOutputStream(), errorResponse);
        }
    }

    private void evictIfOverCapacity(ConcurrentHashMap<String, BucketEntry> map, java.util.concurrent.atomic.AtomicBoolean cleaningFlag) {
        if (map.size() >= MAX_BUCKETS && cleaningFlag.compareAndSet(false, true)) {
            try {
                long cutoff = Instant.now().getEpochSecond() - 300; // evict entries not accessed in 5 minutes
                map.entrySet().removeIf(e -> e.getValue().lastAccessEpochSeconds() < cutoff);
                // If still over 90% of capacity, prune randomly to prevent memory exhaustion
                if (map.size() > (MAX_BUCKETS * 0.9)) {
                    int toRemove = (int) (map.size() - (MAX_BUCKETS * 0.75));
                    var iter = map.keySet().iterator();
                    while (iter.hasNext() && toRemove > 0) {
                        iter.next();
                        iter.remove();
                        toRemove--;
                    }
                }
            } finally {
                cleaningFlag.set(false);
            }
        }
    }

    private boolean isLoopback(String ip) {
        return "127.0.0.1".equals(ip) || "0:0:0:0:0:0:0:1".equals(ip) || "::1".equals(ip);
    }

    private Bucket createGeneralBucket(String clientIp) {
        int rpm = isLoopback(clientIp) ? 10000 : getDynamicRpm();
        Bandwidth limit = Bandwidth.classic(rpm, Refill.greedy(rpm, Duration.ofMinutes(1)));
        return Bucket.builder().addLimit(limit).build();
    }

    private Bucket createVerificationBucket(String clientIp) {
        int vpm = isLoopback(clientIp) ? 5000 : getDynamicVpm();
        Bandwidth limit = Bandwidth.classic(vpm, Refill.greedy(vpm, Duration.ofMinutes(1)));
        return Bucket.builder().addLimit(limit).build();
    }

    private int getDynamicRpm() {
        try {
            Document doc = mongoTemplate.findById("GLOBAL", Document.class, "system_settings");
            if (doc != null && doc.getInteger("requestsPerMinute") != null) {
                return doc.getInteger("requestsPerMinute");
            }
        } catch (Exception e) {
            log.debug("Using default requests-per-minute fallback: {}", defaultRequestsPerMinute);
        }
        return defaultRequestsPerMinute;
    }

    private int getDynamicVpm() {
        try {
            Document doc = mongoTemplate.findById("GLOBAL", Document.class, "system_settings");
            if (doc != null && doc.getInteger("verificationPerMinute") != null) {
                return doc.getInteger("verificationPerMinute");
            }
        } catch (Exception e) {
            log.debug("Using default verification-per-minute fallback: {}", defaultVerificationPerMinute);
        }
        return defaultVerificationPerMinute;
    }

    private String getClientIp(HttpServletRequest request) {
        String remoteAddr = request.getRemoteAddr();
        if (trustProxy && isPrivateOrLoopbackIp(remoteAddr)) {
            String forwarded = request.getHeader("X-Forwarded-For");
            if (forwarded != null && !forwarded.isBlank()) {
                // Extract rightmost hop to prevent client header injection
                String[] hops = forwarded.split(",");
                return hops[hops.length - 1].trim();
            }
            String realIp = request.getHeader("X-Real-IP");
            if (realIp != null && !realIp.isBlank()) {
                return realIp.trim();
            }
        }
        return remoteAddr;
    }

    private boolean isPrivateOrLoopbackIp(String ip) {
        if (ip == null || ip.isBlank()) return false;
        if (isLoopback(ip)) return true;
        return ip.startsWith("10.") || ip.startsWith("192.168.")
                || (ip.startsWith("172.") && isClassBPrivate(ip));
    }

    private boolean isClassBPrivate(String ip) {
        try {
            String[] parts = ip.split("\\.");
            if (parts.length >= 2) {
                int secondOctet = Integer.parseInt(parts[1]);
                return secondOctet >= 16 && secondOctet <= 31;
            }
        } catch (Exception ignored) {}
        return false;
    }
}
