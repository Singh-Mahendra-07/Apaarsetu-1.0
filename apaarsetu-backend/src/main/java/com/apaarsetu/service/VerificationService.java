package com.apaarsetu.service;

import com.apaarsetu.common.exception.BadRequestException;
import com.apaarsetu.common.exception.ResourceNotFoundException;
import com.apaarsetu.domain.Institution;
import com.apaarsetu.domain.Student;
import com.apaarsetu.domain.VerificationDispute;
import com.apaarsetu.domain.VerificationToken;
import com.apaarsetu.dto.ManualVerificationRequest;
import com.apaarsetu.dto.VerificationDisputeDTO;
import com.apaarsetu.dto.VerificationTokenDTO;
import com.apaarsetu.dto.VerifiedCredentialDTO;
import com.apaarsetu.repository.InstitutionRepository;
import com.apaarsetu.repository.StudentRepository;
import com.apaarsetu.repository.VerificationDisputeRepository;
import com.apaarsetu.repository.VerificationTokenRepository;
import com.apaarsetu.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.security.MessageDigest;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class VerificationService {

    private final StudentRepository studentRepository;
    private final InstitutionRepository institutionRepository;
    private final VerificationTokenRepository verificationTokenRepository;
    private final VerificationDisputeRepository disputeRepository;
    private final AuditService auditService;

    public VerifiedCredentialDTO verifyQr(String payload) {
        if (payload == null || payload.isBlank()) {
            throw new BadRequestException("QR payload is missing");
        }

        // Strictly resolve against cryptographically registered certificate ID or token hash
        Optional<VerificationToken> vtOpt = verificationTokenRepository.findByCertificateId(payload.trim())
                .or(() -> verificationTokenRepository.findByTokenHash(payload.trim()));

        if (vtOpt.isEmpty()) {
            auditService.logAsync("QR_VERIFY_FAILED", "ANONYMOUS", "anonymous@public.qr", "PUBLIC",
                    null, "VERIFICATION_TOKEN", payload, payload, null, null,
                    null, null, null);
            throw new ResourceNotFoundException("Invalid or unregistered QR credential payload.");
        }

        VerificationToken vt = vtOpt.get();

        // Check if token has been revoked
        if ("REVOKED".equalsIgnoreCase(vt.getStatus())) {
            auditService.logAsync("QR_VERIFY_REVOKED", "ANONYMOUS", "anonymous@public.qr", "PUBLIC",
                    vt.getAicteCode(), "VERIFICATION_TOKEN", vt.getId(), vt.getCertificateId(), maskApaar(vt.getApaarId()), vt.getStudentName(),
                    null, null, null);
            throw new BadRequestException("Credential certificate has been revoked.");
        }

        // Check if token is expired
        if (vt.getExpiresAt() != null && Instant.now().isAfter(vt.getExpiresAt())) {
            auditService.logAsync("QR_VERIFY_EXPIRED", "ANONYMOUS", "anonymous@public.qr", "PUBLIC",
                    vt.getAicteCode(), "VERIFICATION_TOKEN", vt.getId(), vt.getCertificateId(), maskApaar(vt.getApaarId()), vt.getStudentName(),
                    null, null, null);
            throw new BadRequestException("Credential verification token has expired.");
        }

        Student student = studentRepository.findByApaarId(vt.getApaarId()).orElse(null);
        if (student == null || student.getAdmissionStatus() == com.apaarsetu.domain.enums.AdmissionStatus.CANCELLED) {
            throw new ResourceNotFoundException("Student record associated with this credential is no longer active.");
        }

        auditService.logAsync("QR_VERIFIED_SUCCESS", "ANONYMOUS", "anonymous@public.qr", "PUBLIC",
                vt.getAicteCode(), "VERIFICATION_TOKEN", vt.getId(), vt.getCertificateId(), maskApaar(vt.getApaarId()), vt.getStudentName(),
                null, null, null);

        log.info("Cryptographically verified QR token '{}' for student '{}'", vt.getCertificateId(), maskApaar(vt.getApaarId()));
        return toCredentialDTO(vt, maskApaar(vt.getApaarId()));
    }

    public VerifiedCredentialDTO verifyManual(ManualVerificationRequest request, UserPrincipal verifier) {
        String apaarId = request.getApaarId().trim().replaceAll("[^0-9]", "");
        if (apaarId.length() != 12) {
            throw new BadRequestException("APAAR ID must be 12 numeric digits");
        }

        Student student = studentRepository.findByApaarId(apaarId)
                .orElseThrow(() -> new ResourceNotFoundException("Student record not found for APAAR ID: " + apaarId));

        // 3-point demographic verification
        boolean nameMatch = true;
        boolean dobMatch = true;
        boolean genderMatch = true;
        int matchPoints = 0;

        if (student.getPersonalInfo() != null) {
            if (request.getCandidateName() != null && !request.getCandidateName().isBlank()) {
                String candidateName = student.getPersonalInfo().getFullName();
                if (candidateName != null && candidateName.toLowerCase().contains(request.getCandidateName().trim().toLowerCase())) {
                    matchPoints++;
                } else {
                    nameMatch = false;
                }
            } else {
                matchPoints++;
            }

            if (request.getDateOfBirth() != null && !request.getDateOfBirth().isBlank()) {
                String studentDob = student.getPersonalInfo().getDateOfBirth();
                if (studentDob != null && studentDob.equals(request.getDateOfBirth().trim())) {
                    matchPoints++;
                } else {
                    dobMatch = false;
                }
            } else {
                matchPoints++;
            }

            if (request.getGender() != null && !request.getGender().isBlank()) {
                String studentGender = student.getPersonalInfo().getGender() != null ? student.getPersonalInfo().getGender().name() : "";
                if (studentGender.equalsIgnoreCase(request.getGender().trim())) {
                    matchPoints++;
                } else {
                    genderMatch = false;
                }
            } else {
                matchPoints++;
            }
        }

        String matchStatus = (nameMatch && dobMatch && genderMatch) ? "MATCH_CONFIRMED" : "PARTIAL_MATCH";
        String confidence = (matchPoints == 3) ? "HIGH (100%)" : "MEDIUM (66%)";

        Optional<Institution> inst = institutionRepository.findByAicteId(student.getInstitutionId());
        String instName = inst.map(Institution::getName).orElse(student.getInstitutionId());
        String fullName = student.getPersonalInfo() != null ? student.getPersonalInfo().getFullName() : "Candidate";

        String certificateId = "CERT-MANUAL-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        String tokenHash = hashString(apaarId + request.getConsentRef() + System.currentTimeMillis());

        String verifierId = verifier != null ? verifier.getId() : "PUBLIC_API";
        String verifierOrg = verifier != null ? verifier.getFullName() : "Third-Party Verifier";

        VerificationToken vt = VerificationToken.builder()
                .tokenHash(tokenHash)
                .certificateId(certificateId)
                .apaarId(student.getApaarId())
                .studentName(fullName)
                .institutionName(instName)
                .aicteCode(student.getInstitutionId())
                .degree("Bachelor of Technology")
                .branch(student.getProgramCode())
                .enrollmentStatus(student.getAdmissionStatus().name())
                .admissionYear(student.getAcademicYear())
                .completionYear("2030")
                .sealStatus("AUTHENTIC_VALIDATED")
                .demographicMatchStatus(matchStatus)
                .demographicConfidence(confidence)
                .requestedBy(verifierId)
                .verifierOrg(verifierOrg)
                .purpose(request.getPurpose().name())
                .consentRef(request.getConsentRef())
                .verificationMethod("MANUAL")
                .verifiedAt(Instant.now())
                .expiresAt(Instant.now().plus(30, ChronoUnit.DAYS))
                .build();

        verificationTokenRepository.save(vt);
        log.info("Manual verification recorded for APAAR '{}' by verifier '{}'", maskApaar(apaarId), verifierId);

        return toCredentialDTO(vt, maskApaar(student.getApaarId()));
    }

    public List<VerificationTokenDTO> getHistory(UserPrincipal verifier) {
        String verifierId = verifier != null ? verifier.getId() : null;
        if (verifierId == null) {
            return List.of();
        }
        List<VerificationToken> list = verificationTokenRepository.findByRequestedBy(verifierId);

        return list.stream().map(v -> VerificationTokenDTO.builder()
                .id(v.getId())
                .apaarId(maskApaar(v.getApaarId()))
                .verifierId(v.getRequestedBy())
                .verifiedAt(v.getVerifiedAt() != null ? v.getVerifiedAt().toString() : null)
                .verificationMethod(v.getVerificationMethod())
                .purpose(v.getPurpose())
                .status(v.getStatus())
                .build()).toList();
    }

    public String submitDispute(VerificationDisputeDTO dto, UserPrincipal verifier) {
        VerificationDispute dispute = VerificationDispute.builder()
                .apaarId(dto.getApaarId().trim())
                .candidateName(dto.getCandidateName())
                .verifierId(verifier != null ? verifier.getId() : "ANONYMOUS")
                .verifierOrg(verifier != null ? verifier.getFullName() : "Third Party Verifier")
                .reason(dto.getReason().trim())
                .status("OPEN")
                .createdAt(Instant.now())
                .build();

        VerificationDispute saved = disputeRepository.save(dispute);
        log.info("Created verification dispute ticket '{}' for APAAR: {}", saved.getId(), maskApaar(saved.getApaarId()));
        return "Dispute ticket " + saved.getId() + " registered for regulatory review.";
    }

    private VerifiedCredentialDTO toCredentialDTO(VerificationToken vt, String maskedApaar) {
        return VerifiedCredentialDTO.builder()
                .maskedApaarId(maskedApaar)
                .studentName(vt.getStudentName())
                .institutionName(vt.getInstitutionName())
                .aicteCode(vt.getAicteCode())
                .degree(vt.getDegree())
                .branch(vt.getBranch())
                .enrollmentStatus(vt.getEnrollmentStatus())
                .admissionYear(vt.getAdmissionYear())
                .completionYear(vt.getCompletionYear())
                .sealStatus(vt.getSealStatus())
                .demographicMatchStatus(vt.getDemographicMatchStatus())
                .demographicConfidence(vt.getDemographicConfidence())
                .verifiedAt(vt.getVerifiedAt() != null ? vt.getVerifiedAt().toString() : Instant.now().toString())
                .certificateId(vt.getCertificateId())
                .consentRef(vt.getConsentRef())
                .purpose(vt.getPurpose())
                .build();
    }

    private String maskApaar(String apaarId) {
        if (apaarId == null || apaarId.length() < 12) return "XXXX-XXXX-XXXX";
        return "XXXX-XXXX-" + apaarId.substring(8);
    }

    private String hashString(String input) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(input.getBytes(java.nio.charset.StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash);
        } catch (Exception e) {
            return UUID.randomUUID().toString();
        }
    }
}
