package com.apaarsetu.service;

import com.apaarsetu.domain.Flag;
import com.apaarsetu.domain.Institution;
import com.apaarsetu.domain.Student;
import com.apaarsetu.domain.enums.AdmissionStatus;
import com.apaarsetu.domain.enums.FlagType;
import com.apaarsetu.domain.enums.SeatCategory;
import com.apaarsetu.domain.enums.ValidationStatus;
import com.apaarsetu.repository.InstitutionRepository;
import com.apaarsetu.repository.StudentRepository;
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
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("VULN-04 Regression: Supernumerary Quota Boundary & Overflow Suite")
class ValidationEngineQuotaSecurityTest {

    @Mock
    private StudentRepository studentRepository;

    @Mock
    private InstitutionRepository institutionRepository;

    @InjectMocks
    private ValidationEngine validationEngine;

    private Institution sampleInstitution;
    private Institution.ApprovedProgram approvedProgram;

    @BeforeEach
    void setUp() {
        Institution.SupernumeraryQuota quota = Institution.SupernumeraryQuota.builder()
                .tfw(3)
                .ews(6)
                .nri(2)
                .ociFn(0)
                .pmsss(2)
                .build();

        approvedProgram = Institution.ApprovedProgram.builder()
                .programCode("CSE101")
                .approvedIntake(60)
                .supernumeraryQuota(quota)
                .build();

        sampleInstitution = Institution.builder()
                .id("inst-1001")
                .aicteId("AICTE-INST-1001")
                .name("Delhi Institute of Technology")
                .approvedPrograms(List.of(approvedProgram))
                .build();
    }

    @Test
    @DisplayName("VULN-04: Supernumerary TFW student exceeding sanctioned quota (3) is flagged with CAPACITY_OVERFLOW")
    void testSupernumeraryTfwQuotaBreachFlagged() {
        when(institutionRepository.findByAicteId("AICTE-INST-1001")).thenReturn(Optional.of(sampleInstitution));
        // Already 3 active TFW students enrolled
        when(studentRepository.countByInstitutionIdAndProgramCodeAndAcademicYearAndSeatCategoryAndAdmissionStatus(
                "AICTE-INST-1001", "CSE101", "2026-27", SeatCategory.SUPERNUMERARY_TFW, AdmissionStatus.ADMITTED_ACTIVE))
                .thenReturn(3L);

        Student student = Student.builder()
                .apaarId("912345678901")
                .institutionId("AICTE-INST-1001")
                .programCode("CSE101")
                .academicYear("2026-27")
                .seatCategory(SeatCategory.SUPERNUMERARY_TFW)
                .build();

        ValidationEngine.ValidationResultBundle bundle = validationEngine.evaluate(student, "STUD-NEW-01");

        assertNotNull(bundle);
        assertEquals(ValidationStatus.NEEDS_REVIEW, bundle.getOverallStatus());
        assertTrue(bundle.getErrorMessages().stream().anyMatch(m -> m.contains("Supernumerary TFW admissions count (4) exceeds sanctioned quota (3)")));
        assertTrue(bundle.getFlagsToRaise().stream().anyMatch(f -> f.getFlagType() == FlagType.CAPACITY_OVERFLOW));
    }
}
