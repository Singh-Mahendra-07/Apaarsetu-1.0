package com.apaarsetu.controller;

import com.apaarsetu.common.dto.ApiResponse;
import com.apaarsetu.common.exception.ForbiddenException;
import com.apaarsetu.domain.Student;
import com.apaarsetu.dto.InstitutionDashboardDTO;
import com.apaarsetu.repository.AuditLogRepository;
import com.apaarsetu.repository.StudentRepository;
import com.apaarsetu.security.UserPrincipal;
import com.apaarsetu.service.DashboardService;
import com.apaarsetu.service.GridFsStorageService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.authority.SimpleGrantedAuthority;

import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("VULN-05 Regression: Multi-Tenant Isolation & IDOR Protection Suite")
class TenantIsolationSecurityTest {

    @Mock
    private DashboardService dashboardService;

    @Mock
    private AuditLogRepository auditLogRepository;

    @Mock
    private GridFsStorageService gridFsStorageService;

    @Mock
    private StudentRepository studentRepository;

    @InjectMocks
    private DashboardController dashboardController;

    private UserPrincipal institutionAdminPrincipal;
    private UserPrincipal aicteAdminPrincipal;

    @BeforeEach
    void setUp() {
        institutionAdminPrincipal = UserPrincipal.builder()
                .id("user-inst-01")
                .email("admin@ditm.ac.in")
                .role("ROLE_INSTITUTION_ADMIN")
                .institutionId("AICTE-INST-1001")
                .build();

        aicteAdminPrincipal = UserPrincipal.builder()
                .id("user-aicte-01")
                .email("admin@aicte.gov.in")
                .role("ROLE_AICTE_ADMIN")
                .build();
    }

    @Test
    @DisplayName("VULN-05: Institution Admin cannot query dashboard of foreign institution (Cross-Tenant IDOR Blocked)")
    void testCrossTenantDashboardBlocked() {
        assertThrows(ForbiddenException.class, () -> {
            dashboardController.getInstitutionDashboard("FOREIGN-INST-9999", "2026-27", institutionAdminPrincipal);
        }, "Querying a different institution ID must throw ForbiddenException");

        verifyNoInteractions(dashboardService);
    }

    @Test
    @DisplayName("VULN-05: Institution Admin querying own institution succeeds")
    void testOwnInstitutionDashboardAllowed() {
        when(dashboardService.getInstitutionDashboard("AICTE-INST-1001", "2026-27"))
                .thenReturn(InstitutionDashboardDTO.builder().institutionId("AICTE-INST-1001").build());

        ResponseEntity<ApiResponse<InstitutionDashboardDTO>> response =
                dashboardController.getInstitutionDashboard("AICTE-INST-1001", "2026-27", institutionAdminPrincipal);

        assertNotNull(response.getBody());
        assertEquals("AICTE-INST-1001", response.getBody().getData().getInstitutionId());
    }

    @Test
    @DisplayName("VULN-05: Institution Admin cannot view audit logs of student enrolled in another institution")
    void testCrossTenantStudentAuditLogsBlocked() {
        Student foreignStudent = Student.builder()
                .id("stud-foreign-01")
                .apaarId("888888888888")
                .institutionId("FOREIGN-INST-9999")
                .build();

        when(studentRepository.findById("stud-foreign-01")).thenReturn(Optional.of(foreignStudent));

        assertThrows(ForbiddenException.class, () -> {
            dashboardController.getStudentAuditLogs("stud-foreign-01", null, institutionAdminPrincipal);
        }, "Accessing foreign student audit logs must throw ForbiddenException");

        verifyNoInteractions(auditLogRepository);
    }
}
