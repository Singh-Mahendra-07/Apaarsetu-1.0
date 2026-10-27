package com.apaarsetu.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * ============================================================================
 * APAARSetu National Registry System — Backend Core Component
 * ============================================================================
 * File: NotificationService.java
 * Package: com.apaarsetu.service
 * Component: NotificationService (class)
 *
 * REASON & ARCHITECTURAL PURPOSE:
 * Dispatches transactional notifications (emails, system alerts) for critical security and regulatory events.
 *
 * WORKING & FUNCTIONAL FLOW:
 * 1. Sends password reset instructions, MFA setup alerts, and compliance violation warnings.
 * 2. Integrates with Spring JavaMailSender with graceful fallback when mail servers are offline.
 * ============================================================================
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class NotificationService {

    private final JavaMailSender mailSender;

    @Async("batchTaskExecutor")
    public void sendEmail(String to, String subject, String body) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(to);
            message.setSubject(subject);
            message.setText(body);
            message.setFrom("noreply@aicte.gov.in");

            mailSender.send(message);
            log.info("Dispatched notification email to: {}", to);
        } catch (Exception e) {
            log.warn("Could not dispatch email to '{}' (mail server may be offline): {}", to, e.getMessage());
        }
    }

    @Async("batchTaskExecutor")
    public void sendNoticeAlert(List<String> recipients, String subject, String body) {
        for (String recipient : recipients) {
            sendEmail(recipient, subject, body);
        }
    }
}
