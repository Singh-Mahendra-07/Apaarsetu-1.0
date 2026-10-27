package com.apaarsetu.security;

import com.apaarsetu.security.jwt.JwtTokenProvider;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * ============================================================================
 * APAARSetu National Registry System — Backend Core Component
 * ============================================================================
 * File: OperatorRbacIntegrationTest.java
 * Package: com.apaarsetu.security
 * Component: OperatorRbacIntegrationTest (class)
 *
 * REASON & ARCHITECTURAL PURPOSE:
 * Integration and regression test suite verifying 'OperatorRbacIntegrationTest' security, business rules, and stability.
 *
 * WORKING & FUNCTIONAL FLOW:
 * 1. Uses SpringBootTest, MockMvc, and embedded or test MongoDB instances.
 * 2. Asserts correct behavior for authorization, business constraints, and error envelopes.
 * 3. Serves as automated regression prevention during continuous integration builds.
 * ============================================================================
 */
@SpringBootTest
@AutoConfigureMockMvc
@DisplayName("Institution Operator RBAC & Security Boundary Verification Test Suite")
public class OperatorRbacIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    private String createOperatorToken(String instId) {
        UserPrincipal operator = UserPrincipal.builder()
                .id("opr-" + instId)
                .email("operator@" + instId.toLowerCase() + ".edu")
                .fullName("Test Operator")
                .role("ROLE_INSTITUTION_OPERATOR")
                .institutionId(instId)
                .status("ACTIVE")
                .build();
        return jwtTokenProvider.generateAccessToken(operator);
    }

    @Test
    @DisplayName("OPR-01: Operator can access institution dashboard for assigned institution")
    void testOperatorCanAccessInstitutionDashboard() throws Exception {
        String token = createOperatorToken("AICTE-INST-1001");

        mockMvc.perform(get("/dashboard/institution")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    @DisplayName("OPR-02: Operator can list batches for their institution")
    void testOperatorCanListBatches() throws Exception {
        String token = createOperatorToken("AICTE-INST-1001");

        mockMvc.perform(get("/batches")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    @DisplayName("OPR-03: Operator can fetch approved programs for their institution")
    void testOperatorCanFetchApprovedPrograms() throws Exception {
        String token = createOperatorToken("AICTE-INST-1001");

        mockMvc.perform(get("/institutions/AICTE-INST-1001/approved-programs")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    @DisplayName("OPR-04: Operator can upload enrollment batch CSV for ingestion")
    void testOperatorCanUploadBatch() throws Exception {
        String token = createOperatorToken("AICTE-INST-1001");

        MockMultipartFile csvFile = new MockMultipartFile(
                "file",
                "operator_test_batch.csv",
                "text/csv",
                "firstName,lastName,apaarId,dob,gender,seatCategory,guardianName\nAmit,Verma,123456789012,2005-01-01,MALE,REGULAR_GENERAL,Suresh Verma\n".getBytes()
        );

        mockMvc.perform(multipart("/batches/upload")
                        .file(csvFile)
                        .param("academicYear", "2026-27")
                        .param("programCode", "CS101")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isAccepted())
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    @DisplayName("OPR-05: Operator is strictly forbidden from approving batches (403)")
    void testOperatorCannotApproveBatch() throws Exception {
        String token = createOperatorToken("AICTE-INST-1001");

        mockMvc.perform(post("/batches/BATCH-9921/approve")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("OPR-06: Operator is strictly forbidden from rejecting batches (403)")
    void testOperatorCannotRejectBatch() throws Exception {
        String token = createOperatorToken("AICTE-INST-1001");

        mockMvc.perform(post("/batches/BATCH-9921/reject")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("OPR-07: Operator is strictly forbidden from updating institution seat quotas (403)")
    void testOperatorCannotUpdateIntake() throws Exception {
        String token = createOperatorToken("AICTE-INST-1001");

        mockMvc.perform(put("/institutions/AICTE-INST-1001/intake")
                        .header("Authorization", "Bearer " + token)
                        .contentType("application/json")
                        .content("{\"approvedIntake\": 200}"))
                .andExpect(status().isForbidden());
    }
}
