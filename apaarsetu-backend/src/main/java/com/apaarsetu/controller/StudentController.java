package com.apaarsetu.controller;

import com.apaarsetu.common.dto.ApiResponse;
import com.apaarsetu.common.dto.PagedResponse;
import com.apaarsetu.dto.*;
import com.apaarsetu.security.UserPrincipal;
import com.apaarsetu.service.StudentService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.Resource;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.gridfs.GridFsResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

/**
 * ============================================================================
 * APAARSetu National Registry System — Backend Core Component
 * ============================================================================
 * File: StudentController.java
 * Package: com.apaarsetu.controller
 * Component: StudentController (class)
 *
 * REASON & ARCHITECTURAL PURPOSE:
 * Primary REST controller for candidate registration, 12-digit APAAR lookups, student updates, and dispute evidence file uploads.
 *
 * WORKING & FUNCTIONAL FLOW:
 * 1. Exposes POST /students to register individual students with real-time validation.
 * 2. Exposes GET /students with rich filtering (institutionId, program, year, validationStatus, keyword) and pagination.
 * 3. Exposes GET /students/{id} and GET /students/search?apaarId=... for verified dossier inspection.
 * 4. Exposes POST /students/{id}/evidence to store supporting verification documents into MongoDB GridFS.
 * ============================================================================
 */
@Slf4j
@RestController
@RequestMapping("/students")
@RequiredArgsConstructor
public class StudentController {

    private final StudentService studentService;

    @PostMapping
    @PreAuthorize("hasAnyRole('INSTITUTION_ADMIN', 'INSTITUTION_OPERATOR', 'AICTE_ADMIN')")
    public ResponseEntity<ApiResponse<StudentResponseDTO>> createStudent(
            @Valid @RequestBody CreateStudentDTO dto,
            @AuthenticationPrincipal UserPrincipal principal,
            HttpServletRequest request) {

        String clientIp = request.getRemoteAddr();
        String userAgent = request.getHeader("User-Agent");

        StudentResponseDTO response = studentService.createStudent(dto, principal, clientIp, userAgent);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Student registered and validated successfully", response));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('INSTITUTION_ADMIN', 'INSTITUTION_OPERATOR', 'AICTE_ADMIN', 'AICTE_OFFICER')")
    public ResponseEntity<ApiResponse<PagedResponse<StudentListDTO>>> getStudents(
            @RequestParam(value = "institutionId", required = false) String institutionId,
            @RequestParam(value = "programCode", required = false) String programCode,
            @RequestParam(value = "academicYear", required = false) String academicYear,
            @RequestParam(value = "validationStatus", required = false) String validationStatus,
            @RequestParam(value = "admissionStatus", required = false) String admissionStatus,
            @RequestParam(value = "keyword", required = false) String keyword,
            @RequestParam(value = "page", defaultValue = "0") int page,
            @RequestParam(value = "size", defaultValue = "10") int size,
            @AuthenticationPrincipal UserPrincipal principal) {

        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        PagedResponse<StudentListDTO> response = studentService.getStudents(
                institutionId, programCode, academicYear, validationStatus, admissionStatus, keyword, pageable, principal);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('INSTITUTION_ADMIN', 'AICTE_ADMIN', 'AICTE_OFFICER')")
    public ResponseEntity<ApiResponse<StudentDetailDTO>> getStudentById(
            @PathVariable String id,
            @AuthenticationPrincipal UserPrincipal principal) {

        StudentDetailDTO response = studentService.getStudentById(id, principal);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('INSTITUTION_ADMIN', 'AICTE_ADMIN')")
    public ResponseEntity<ApiResponse<StudentResponseDTO>> updateStudent(
            @PathVariable String id,
            @Valid @RequestBody UpdateStudentDTO dto,
            @AuthenticationPrincipal UserPrincipal principal,
            HttpServletRequest request) {

        String clientIp = request.getRemoteAddr();
        String userAgent = request.getHeader("User-Agent");

        StudentResponseDTO response = studentService.updateStudent(id, dto, principal, clientIp, userAgent);
        return ResponseEntity.ok(ApiResponse.success("Student updated successfully", response));
    }

    @GetMapping("/search")
    @PreAuthorize("hasAnyRole('INSTITUTION_ADMIN', 'AICTE_ADMIN', 'AICTE_OFFICER')")
    public ResponseEntity<ApiResponse<StudentResponseDTO>> searchByApaarId(
            @RequestParam("apaarId") String apaarId,
            @AuthenticationPrincipal UserPrincipal principal) {

        StudentResponseDTO response = studentService.searchByApaarId(apaarId, principal);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping(value = "/{id}/evidence", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAnyRole('INSTITUTION_ADMIN', 'AICTE_ADMIN')")
    public ResponseEntity<ApiResponse<String>> uploadEvidence(
            @PathVariable String id,
            @RequestParam("file") MultipartFile file,
            @AuthenticationPrincipal UserPrincipal principal,
            HttpServletRequest request) {

        String clientIp = request.getRemoteAddr();
        String userAgent = request.getHeader("User-Agent");

        String filename = studentService.uploadEvidence(id, file, principal, clientIp, userAgent);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Evidence document stored successfully in GridFS: " + filename, filename));
    }

    @GetMapping("/{id}/evidence/{filename}")
    @PreAuthorize("hasAnyRole('INSTITUTION_ADMIN', 'AICTE_ADMIN', 'AICTE_OFFICER')")
    public ResponseEntity<Resource> downloadEvidence(
            @PathVariable String id,
            @PathVariable String filename,
            @AuthenticationPrincipal UserPrincipal principal) {

        GridFsResource resource = studentService.getEvidenceResource(id, filename, principal);

        String contentType = resource.getContentType();
        if (contentType == null || contentType.isBlank()) {
            contentType = MediaType.APPLICATION_OCTET_STREAM_VALUE;
        }

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_TYPE, contentType)
                .header("X-Content-Type-Options", "nosniff")
                .header("Content-Security-Policy", "default-src 'none'; sandbox")
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + filename + "\"")
                .body(resource);
    }
}
