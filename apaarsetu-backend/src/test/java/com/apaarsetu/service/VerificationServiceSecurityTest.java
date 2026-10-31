package com.apaarsetu.service;

import com.apaarsetu.domain.Institution;
import com.apaarsetu.domain.Student;
import com.apaarsetu.domain.enums.AdmissionStatus;
import com.apaarsetu.domain.enums.Gender;
import com.apaarsetu.domain.enums.VerificationPurpose;
import com.apaarsetu.dto.ManualVerificationRequest;
import com.apaarsetu.dto.VerifiedCredentialDTO;
import com.apaarsetu.repository.InstitutionRepository;
import com.apaarsetu.repository.StudentRepository;
import com.apaarsetu.repository.VerificationDisputeRepository;
import com.apaarsetu.repository.VerificationTokenRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("VULN-02 Regression: Demographic Fail-Closed Verification Suite")
class VerificationServiceSecurityTest {

    @Mock
    private StudentRepository studentRepository;

    @Mock
    private InstitutionRepository institutionRepository;

    @Mock
    private VerificationTokenRepository verificationTokenRepository;

    @Mock
    private VerificationDisputeRepository disputeRepository;

    @Mock
    private AuditService auditService;

    @InjectMocks
    private VerificationService verificationService;

    private Student admittedStudent;
    private Institution sampleInstitution;

    @BeforeEach
    void setUp() {
        Student.PersonalInfo personal = new Student.PersonalInfo();
        personal.setFullName("Aarav Sharma");
        personal.setDateOfBirth("2003-05-15");
        personal.setGender(Gender.MALE);

        admittedStudent = Student.builder()
                .id("stud-9901")
                .apaarId("912345678901")
                .institutionId("AICTE-INST-1001")
                .programCode("CSE101")
                .academicYear("2023-2024")
                .admissionStatus(AdmissionStatus.ADMITTED_ACTIVE)
                .personalInfo(personal)
                .build();

        Institution.ApprovedProgram cseProgram = Institution.ApprovedProgram.builder()
                .programCode("CSE101")
                .programName("Computer Science & Engineering")
                .level("UNDERGRADUATE")
                .duration(4)
                .approvedIntake(120)
                .build();

        sampleInstitution = Institution.builder()
                .id("inst-1001")
                .aicteId("AICTE-INST-1001")
                .name("Delhi Institute of Technology")
                .approvedPrograms(List.of(cseProgram))
                .build();
    }

    @Test
    @DisplayName("VULN-02: Empty candidate demographic fields must fail closed without leaking credentials")
    void testEmptyDemographicsFailsClosed() {
        when(studentRepository.findByApaarId("912345678901")).thenReturn(Optional.of(admittedStudent));
        when(institutionRepository.findByAicteId("AICTE-INST-1001")).thenReturn(Optional.of(sampleInstitution));

        ManualVerificationRequest emptyRequest = new ManualVerificationRequest();
        emptyRequest.setApaarId("912345678901");
        emptyRequest.setCandidateName("");
        emptyRequest.setDateOfBirth("");
        emptyRequest.setGender("");
        emptyRequest.setPurpose(VerificationPurpose.EMPLOYMENT);
        emptyRequest.setConsentRef("CONSENT-REF-2026-001");

        VerifiedCredentialDTO result = verificationService.verifyManual(emptyRequest, null);

        assertNotNull(result);
        assertEquals("UNVERIFIED_MISMATCH", result.getDemographicMatchStatus());
        assertEquals("VERIFICATION_FAILED", result.getSealStatus());
        assertEquals("UNVERIFIED", result.getVerificationStatus(), "Verification status must be UNVERIFIED on mismatch");
        assertEquals("CANDIDATE UNVERIFIED", result.getStudentName(), "Student name must be masked on demographic mismatch");
        assertEquals("RESTRICTED", result.getInstitutionName(), "Institution name must not be disclosed");
        assertNull(result.getDegree(), "Degree must not be disclosed when demographics do not match");
        assertNull(result.getCompletionYear(), "Completion year must not be disclosed");

        verify(verificationTokenRepository).save(any());
    }

    @Test
    @DisplayName("VULN-02: Accurate demographic verification succeeds with full details and valid completion year")
    void testAccurateDemographicVerificationSucceeds() {
        when(studentRepository.findByApaarId("912345678901")).thenReturn(Optional.of(admittedStudent));
        when(institutionRepository.findByAicteId("AICTE-INST-1001")).thenReturn(Optional.of(sampleInstitution));

        ManualVerificationRequest validRequest = new ManualVerificationRequest();
        validRequest.setApaarId("912345678901");
        validRequest.setCandidateName("Aarav Sharma");
        validRequest.setDateOfBirth("2003-05-15");
        validRequest.setGender("MALE");
        validRequest.setPurpose(VerificationPurpose.EMPLOYMENT);
        validRequest.setConsentRef("CONSENT-REF-2026-002");

        VerifiedCredentialDTO result = verificationService.verifyManual(validRequest, null);

        assertNotNull(result);
        assertEquals("MATCH_CONFIRMED", result.getDemographicMatchStatus());
        assertEquals("HIGH (100%)", result.getDemographicConfidence());
        assertEquals("AUTHENTIC_VALIDATED", result.getSealStatus());
        assertEquals("VERIFIED", result.getVerificationStatus());
        assertEquals("Aarav Sharma", result.getStudentName());
        assertEquals("Delhi Institute of Technology", result.getInstitutionName());
        assertEquals("Computer Science & Engineering", result.getDegree(), "Must resolve program name from approved programs");
        assertEquals("2027", result.getCompletionYear(), "2023 admission + 4 year duration = 2027 completion");
    }
}

