package com.apaarsetu.service;

import com.apaarsetu.common.exception.BadRequestException;
import com.apaarsetu.domain.Institution;
import com.apaarsetu.domain.Student;
import com.apaarsetu.domain.UploadBatch;
import com.apaarsetu.domain.enums.AdmissionStatus;
import com.apaarsetu.domain.enums.BatchStatus;
import com.apaarsetu.domain.enums.SeatCategory;
import com.apaarsetu.domain.enums.ValidationStatus;
import com.apaarsetu.repository.InstitutionRepository;
import com.apaarsetu.repository.StudentRepository;
import com.apaarsetu.repository.UploadBatchRepository;
import com.apaarsetu.security.UserPrincipal;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.authority.SimpleGrantedAuthority;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("VULN-04 Regression: Batch Approval Capacity & State Machine Guard Suite")
class BatchCapacityApprovalSecurityTest {

    @Mock
    private UploadBatchRepository batchRepository;

    @Mock
    private StudentRepository studentRepository;

    @Mock
    private InstitutionRepository institutionRepository;

    @Mock
    private AuditService auditService;

    @InjectMocks
    private BatchUploadService batchUploadService;

    private UserPrincipal adminPrincipal;

    @BeforeEach
    void setUp() {
        adminPrincipal = UserPrincipal.builder()
                .id("admin-01")
                .email("admin@ditm.ac.in")
                .role("ROLE_INSTITUTION_ADMIN")
                .institutionId("AICTE-INST-1001")
                .build();
    }

    @Test
    @DisplayName("VULN-04: Cannot approve batch with FLAGGED status (Unresolved dispute flags)")
    void testApproveFlaggedBatchRejected() {
        UploadBatch flaggedBatch = UploadBatch.builder()
                .id("batch-flagged-01")
                .institutionId("AICTE-INST-1001")
                .status(BatchStatus.FLAGGED)
                .build();

        when(batchRepository.findById("batch-flagged-01")).thenReturn(Optional.of(flaggedBatch));

        BadRequestException ex = assertThrows(BadRequestException.class, () -> {
            batchUploadService.approveBatch("batch-flagged-01", adminPrincipal, "127.0.0.1", "JUnit");
        });

        assertTrue(ex.getMessage().contains("Cannot approve batch with FLAGGED status"));
        verify(studentRepository, never()).save(any());
    }

    @Test
    @DisplayName("VULN-04: Re-approving an already APPROVED batch is rejected")
    void testDoubleBatchApprovalRejected() {
        UploadBatch approvedBatch = UploadBatch.builder()
                .id("batch-appr-01")
                .institutionId("AICTE-INST-1001")
                .status(BatchStatus.APPROVED)
                .build();

        when(batchRepository.findById("batch-appr-01")).thenReturn(Optional.of(approvedBatch));

        BadRequestException ex = assertThrows(BadRequestException.class, () -> {
            batchUploadService.approveBatch("batch-appr-01", adminPrincipal, "127.0.0.1", "JUnit");
        });

        assertTrue(ex.getMessage().contains("already approved"));
    }

    @Test
    @DisplayName("VULN-04: Batch approval fails closed if promoting students exceeds approved program intake")
    void testCapacityOverflowBlocksBatchApproval() {
        UploadBatch batch = UploadBatch.builder()
                .id("batch-overflow-01")
                .institutionId("AICTE-INST-1001")
                .programCode("CSE101")
                .academicYear("2026-27")
                .status(BatchStatus.VALIDATED)
                .build();

        Student s1 = Student.builder()
                .id("s1")
                .batchId("batch-overflow-01")
                .seatCategory(SeatCategory.REGULAR_GENERAL)
                .admissionStatus(AdmissionStatus.PROVISIONAL)
                .validationStatus(ValidationStatus.VALIDATED)
                .build();

        Institution.ApprovedProgram prog = Institution.ApprovedProgram.builder()
                .programCode("CSE101")
                .approvedIntake(60)
                .build();

        Institution inst = Institution.builder()
                .aicteId("AICTE-INST-1001")
                .approvedPrograms(List.of(prog))
                .build();

        when(batchRepository.findById("batch-overflow-01")).thenReturn(Optional.of(batch));
        when(studentRepository.findByBatchId("batch-overflow-01")).thenReturn(List.of(s1));
        when(institutionRepository.findByAicteId("AICTE-INST-1001")).thenReturn(Optional.of(inst));
        // Current admitted is already at the limit of 60
        when(studentRepository.countByInstitutionIdAndProgramCodeAndAcademicYearAndAdmissionStatus(
                "AICTE-INST-1001", "CSE101", "2026-27", AdmissionStatus.ADMITTED_ACTIVE)).thenReturn(60L);

        BadRequestException ex = assertThrows(BadRequestException.class, () -> {
            batchUploadService.approveBatch("batch-overflow-01", adminPrincipal, "127.0.0.1", "JUnit");
        });

        assertTrue(ex.getMessage().contains("would exceed approved program intake"));
        verify(studentRepository, never()).save(any());
    }
}
