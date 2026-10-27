package com.apaarsetu.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.util.List;

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
