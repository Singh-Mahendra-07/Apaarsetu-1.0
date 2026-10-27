package com.apaarsetu.security;

import com.apaarsetu.domain.Student;
import com.apaarsetu.domain.UploadBatch;
import com.apaarsetu.domain.enums.AdmissionStatus;
import com.apaarsetu.domain.enums.BatchStatus;
import com.apaarsetu.domain.enums.SeatCategory;
import com.apaarsetu.domain.enums.ValidationStatus;
import com.apaarsetu.repository.StudentRepository;
import com.apaarsetu.repository.UploadBatchRepository;
import com.apaarsetu.security.jwt.JwtTokenProvider;
import com.apaarsetu.service.BatchUploadService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@DisplayName("Batch Verification & Ingestion Business Logic Regression Suite")
public class BatchVerificationRegressionIntegrationTest {

        @Autowired
        private MockMvc mockMvc;

        @Autowired
        private JwtTokenProvider jwtTokenProvider;

        @Autowired
        private UploadBatchRepository batchRepository;

        @Autowired
        private StudentRepository studentRepository;

        @Autowired
        private BatchUploadService batchUploadService;

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
        @DisplayName("REG-01: CSV with existing student ID completes verification without crashing or hanging")
        void testCsvUploadWithExistingStudentDoesNotHang() throws Exception {
                String token = createOperatorToken("AICTE-INST-1001");
                String apaarId = "984512345678"; // Already exists in test DB with CANCELLED status

                String csvContent = "apaarId,fullName,dateOfBirth,gender,nationality,reservationCategory,programCode,academicYear,seatCategory,admissionDate,admissionMode,rollNumber,contactEmail,contactPhone\n"
                                + apaarId
                                + ",Aarav Sharma,2005-04-12,MALE,INDIAN,GENERAL,CS101,2026-27,REGULAR_GENERAL,2026-06-15,CENTRALIZED,CSE-2026-001,aarav.sharma@example.com,9876543210\n";

                MockMultipartFile file = new MockMultipartFile(
                                "file", "existing_student_test.csv", "text/csv",
                                csvContent.getBytes(StandardCharsets.UTF_8));

                MvcResult result = mockMvc.perform(multipart("/batches/upload")
                                .file(file)
                                .param("academicYear", "2026-27")
                                .param("programCode", "CS101")
                                .header("Authorization", "Bearer " + token))
                                .andExpect(status().isAccepted())
                                .andExpect(jsonPath("$.success").value(true))
                                .andReturn();

                String responseJson = result.getResponse().getContentAsString();
                String batchId = com.jayway.jsonpath.JsonPath.read(responseJson, "$.data.id");
                assertThat(batchId).isNotNull();

                // Wait up to 5 seconds for async processing to complete
                UploadBatch processedBatch = null;
                for (int i = 0; i < 25; i++) {
                        Thread.sleep(200);
                        processedBatch = batchRepository.findById(batchId).orElse(null);
                        if (processedBatch != null && processedBatch.getStatus() != BatchStatus.PROCESSING) {
                                break;
                        }
                }

                assertThat(processedBatch).isNotNull();
                assertThat(processedBatch.getStatus())
                                .as("Batch must transition out of PROCESSING")
                                .isIn(BatchStatus.VALIDATED, BatchStatus.FLAGGED);
                assertThat(processedBatch.getCompletedAt()).isNotNull();
                assertThat(processedBatch.getSummary().getPendingVerification()).isEqualTo(0);
        }

        @Test
        @DisplayName("REG-02: CSV with in-batch duplicate APAAR IDs flags duplicates and does not crash")
        void testCsvUploadWithInBatchDuplicates() throws Exception {
                String token = createOperatorToken("AICTE-INST-1001");
                String dupApaar = "777000111222";

                String csvContent = "apaarId,fullName,dateOfBirth,gender,nationality,reservationCategory,programCode,academicYear,seatCategory,admissionDate,admissionMode,rollNumber,contactEmail,contactPhone\n"
                                + dupApaar
                                + ",First Student,2005-04-12,MALE,INDIAN,GENERAL,CS101,2026-27,REGULAR_GENERAL,2026-06-15,CENTRALIZED,CSE-01,s1@example.com,9876543210\n"
                                + dupApaar
                                + ",Duplicate Row,2005-04-12,MALE,INDIAN,GENERAL,CS101,2026-27,REGULAR_GENERAL,2026-06-15,CENTRALIZED,CSE-02,s2@example.com,9876543211\n";

                MockMultipartFile file = new MockMultipartFile(
                                "file", "inbatch_dup_test.csv", "text/csv",
                                csvContent.getBytes(StandardCharsets.UTF_8));

                MvcResult result = mockMvc.perform(multipart("/batches/upload")
                                .file(file)
                                .param("academicYear", "2026-27")
                                .param("programCode", "CS101")
                                .header("Authorization", "Bearer " + token))
                                .andExpect(status().isAccepted())
                                .andReturn();

                String responseJson = result.getResponse().getContentAsString();
                String batchId = com.jayway.jsonpath.JsonPath.read(responseJson, "$.data.id");

                UploadBatch processedBatch = null;
                for (int i = 0; i < 25; i++) {
                        Thread.sleep(200);
                        processedBatch = batchRepository.findById(batchId).orElse(null);
                        if (processedBatch != null && processedBatch.getStatus() != BatchStatus.PROCESSING) {
                                break;
                        }
                }

                assertThat(processedBatch).isNotNull();
                assertThat(processedBatch.getStatus()).isEqualTo(BatchStatus.FLAGGED);
                assertThat(processedBatch.getErrors()).anyMatch(e -> "DUPLICATE_IN_BATCH".equals(e.getRuleCode()));
        }

        @Test
        @DisplayName("REG-03: Parameter sanitization handles comma-duplicated request params without failure")
        void testCommaSeparatedParameterSanitization() throws Exception {
                String token = createOperatorToken("AICTE-INST-1001");

                String csvContent = "apaarId,fullName,dateOfBirth,gender,nationality,reservationCategory,programCode,academicYear,seatCategory,admissionDate,admissionMode,rollNumber,contactEmail,contactPhone\n"
                                + "555111222333,Clean Param Student,2005-01-10,FEMALE,INDIAN,GENERAL,CS101,2026-27,SUPERNUMERARY_TFW,2026-06-15,CENTRALIZED,CSE-03,s3@example.com,9876543212\n";

                MockMultipartFile file = new MockMultipartFile(
                                "file", "param_dup_test.csv", "text/csv", csvContent.getBytes(StandardCharsets.UTF_8));

                MvcResult result = mockMvc.perform(multipart("/batches/upload")
                                .file(file)
                                .param("academicYear", "2026-27,2026-27")
                                .param("programCode", "CS101,CS101")
                                .header("Authorization", "Bearer " + token))
                                .andExpect(status().isAccepted())
                                .andReturn();

                String responseJson = result.getResponse().getContentAsString();
                String batchId = com.jayway.jsonpath.JsonPath.read(responseJson, "$.data.id");
                UploadBatch b = batchRepository.findById(batchId).orElseThrow();

                assertThat(b.getAcademicYear()).isEqualTo("2026-27");
                assertThat(b.getProgramCode()).isEqualTo("CS101");
        }

        @Test
        @DisplayName("REG-04: Orphaned PROCESSING batches are recovered and transitioned to FAILED")
        void testStuckBatchRecovery() {
                UploadBatch stuck = UploadBatch.builder()
                                .institutionId("AICTE-INST-1001")
                                .academicYear("2026-27")
                                .programCode("CS101")
                                .fileName("orphan_test.csv")
                                .totalRows(50)
                                .status(BatchStatus.PROCESSING)
                                .uploadedBy("test@example.com")
                                .createdAt(Instant.now().minusSeconds(600))
                                .build();
                UploadBatch saved = batchRepository.save(stuck);

                batchUploadService.recoverStuckBatches();

                UploadBatch recovered = batchRepository.findById(saved.getId()).orElseThrow();
                assertThat(recovered.getStatus()).isEqualTo(BatchStatus.FAILED);
                assertThat(recovered.getErrors()).anyMatch(e -> "PROCESSING_TIMEOUT".equals(e.getRuleCode()));
        }
}
