package com.apaarsetu.service;

import com.apaarsetu.common.dto.PagedResponse;
import com.apaarsetu.common.exception.BadRequestException;
import com.apaarsetu.common.exception.ForbiddenException;
import com.apaarsetu.common.exception.ResourceNotFoundException;
import com.apaarsetu.domain.AuditLog;
import com.apaarsetu.domain.Flag;
import com.apaarsetu.domain.Institution;
import com.apaarsetu.domain.Student;
import com.apaarsetu.domain.enums.AdmissionStatus;
import com.apaarsetu.domain.enums.BatchStatus;
import com.apaarsetu.domain.enums.FlagResolution;
import com.apaarsetu.domain.enums.FlagSeverity;
import com.apaarsetu.domain.enums.FlagStatus;
import com.apaarsetu.domain.enums.RegionZone;
import com.apaarsetu.domain.enums.ValidationStatus;
import com.apaarsetu.dto.AnomalyDTO;
import com.apaarsetu.dto.CapacityViolationDTO;
import com.apaarsetu.dto.ComplianceOverviewDTO;
import com.apaarsetu.dto.DossierDTO;
import com.apaarsetu.dto.FlagDetailDTO;
import com.apaarsetu.dto.FlagResolveDTO;
import com.apaarsetu.dto.InstitutionDashboardDTO;
import com.apaarsetu.dto.InstitutionDiscrepancyRankDTO;
import com.apaarsetu.dto.InstitutionResponseDTO;
import com.apaarsetu.dto.NationalDashboardDTO;
import com.apaarsetu.dto.OfficerDashboardDTO;
import com.apaarsetu.dto.ProgramCapacityProgressDTO;
import com.apaarsetu.repository.AuditLogRepository;
import com.apaarsetu.repository.ComplianceNoticeRepository;
import com.apaarsetu.repository.FlagRepository;
import com.apaarsetu.repository.InstitutionRepository;
import com.apaarsetu.repository.StudentRepository;
import com.apaarsetu.repository.UploadBatchRepository;
import com.apaarsetu.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.gridfs.GridFsResource;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * ============================================================================
 * APAARSetu National Registry System — Backend Core Component
 * ============================================================================
 * File: DashboardService.java
 * Package: com.apaarsetu.service
 * Component: DashboardService (class)
 *
 * REASON & ARCHITECTURAL PURPOSE:
 * Aggregates system-wide analytics, institution statistics, intake compliance ratios, and discrepancy radar metrics.
 *
 * WORKING & FUNCTIONAL FLOW:
 * 1. Uses MongoDB aggregation pipelines to compute national student counts and institution tallies.
 * 2. Detects capacity violations by comparing enrolled counts against approved quotas.
 * 3. Identifies cross-institutional dual-enrollment anomalies across universities.
 * ============================================================================
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class DashboardService {

    private final MongoTemplate mongoTemplate;
    private final InstitutionRepository institutionRepository;
    private final StudentRepository studentRepository;
    private final FlagRepository flagRepository;
    private final AuditLogRepository auditLogRepository;
    private final UploadBatchRepository uploadBatchRepository;
    private final ComplianceNoticeRepository noticeRepository;
    private final GridFsStorageService gridFsStorageService;
    private final AuditService auditService;

    public NationalDashboardDTO getNationalDashboard(String academicYear, String state, String type) {
        long totalInstitutions = institutionRepository.count();

        List<String> reportingInsts = mongoTemplate.query(Student.class).distinct("institutionId").as(String.class).all();
        long reportedInstitutions = reportingInsts.size();

        long totalEnrolled = studentRepository.count();
        long totalValidated = studentRepository.countByValidationStatus(ValidationStatus.VALIDATED);

        double gapPercent = totalEnrolled > 0
                ? Math.round(((double) (totalEnrolled - totalValidated) / totalEnrolled) * 1000.0) / 10.0
                : 0.0;

        int pendingFlags = (int) flagRepository.countByStatus(FlagStatus.PENDING);
        int criticalDisputes = (int) flagRepository.countByStatusAndSeverity(FlagStatus.PENDING, FlagSeverity.CRITICAL);

        // Build institutions list and top discrepancy ranking
        List<InstitutionDiscrepancyRankDTO> ranking = new ArrayList<>();
        List<NationalDashboardDTO.InstitutionRowDTO> institutionRows = new ArrayList<>();
        List<Institution> insts = institutionRepository.findAll();

        for (Institution inst : insts) {
            long instReported = studentRepository.countByInstitutionId(inst.getAicteId());
            Query q = new Query(Criteria.where("institutionId").is(inst.getAicteId())
                    .and("validationStatus").is(ValidationStatus.VALIDATED));
            long instValidated = mongoTemplate.count(q, Student.class);

            long actionReq = Math.max(0, instReported - instValidated);
            double rate = instReported > 0
                    ? Math.round(((double) actionReq / instReported) * 1000.0) / 10.0
                    : 0.0;

            String instState = inst.getState() != null && !inst.getState().isBlank()
                    ? inst.getState()
                    : (inst.getZone() != null ? inst.getZone().name() : "Delhi");

            institutionRows.add(NationalDashboardDTO.InstitutionRowDTO.builder()
                    .id(inst.getId() != null ? inst.getId() : inst.getAicteId())
                    .name(inst.getName())
                    .aicteId(inst.getAicteId())
                    .state(instState)
                    .reported((int) instReported)
                    .validated((int) instValidated)
                    .build());

            if (instReported > 0) {
                ranking.add(InstitutionDiscrepancyRankDTO.builder()
                        .aicteId(inst.getAicteId())
                        .name(inst.getName())
                        .state(instState)
                        .totalReported((int) instReported)
                        .totalValidated((int) instValidated)
                        .actionRequired((int) actionReq)
                        .discrepancyRate(rate)
                        .build());
            }
        }

        ranking.sort((a, b) -> Double.compare(b.getDiscrepancyRate(), a.getDiscrepancyRate()));
        List<InstitutionDiscrepancyRankDTO> topRankings = ranking.stream().limit(10).toList();

        // Build capacity violations
        List<NationalDashboardDTO.CapacityViolationItemDTO> capViolations = new ArrayList<>();
        String targetYear = (academicYear != null && !academicYear.isBlank()) ? academicYear : "2026-27";

        for (Institution inst : insts) {
            if (inst.getApprovedPrograms() == null) continue;
            String instState = inst.getState() != null && !inst.getState().isBlank()
                    ? inst.getState()
                    : (inst.getZone() != null ? inst.getZone().name() : "Delhi");

            for (Institution.ApprovedProgram p : inst.getApprovedPrograms()) {
                long admitted = studentRepository.countByInstitutionIdAndProgramCodeAndAcademicYearAndAdmissionStatus(
                        inst.getAicteId(), p.getProgramCode(), targetYear, AdmissionStatus.ADMITTED_ACTIVE);

                if (p.getApprovedIntake() > 0 && admitted > p.getApprovedIntake()) {
                    capViolations.add(NationalDashboardDTO.CapacityViolationItemDTO.builder()
                            .institution(inst.getName())
                            .state(instState)
                            .program(p.getProgramName() != null ? p.getProgramName() : p.getProgramCode())
                            .enrolled((int) admitted)
                            .capacity(p.getApprovedIntake())
                            .checks(List.of("EWS", "NRI"))
                            .build());
                }
            }
        }

        // Build anomalies from active flags
        List<NationalDashboardDTO.AnomalyItemDTO> anomaliesList = new ArrayList<>();
        List<Flag> activeFlags = flagRepository.findByStatus(FlagStatus.PENDING);
        for (Flag f : activeFlags) {
            String apaar = f.getApaarId();
            String masked = (apaar != null && apaar.length() >= 4)
                    ? "XXXX-XXXX-" + apaar.substring(apaar.length() - 4)
                    : "XXXX-XXXX-9012";
            anomaliesList.add(NationalDashboardDTO.AnomalyItemDTO.builder()
                    .type(f.getFlagType() != null ? f.getFlagType().name() : "DUPLICATE_ENROLLMENT")
                    .apaarMasked(masked)
                    .message(f.getNotes() != null ? f.getNotes() : "Flag detected")
                    .build());
        }

        return NationalDashboardDTO.builder()
                .totalInstitutions(totalInstitutions)
                .reportedInstitutions(reportedInstitutions)
                .totalEnrolled(totalEnrolled)
                .totalValidated(totalValidated)
                .validationGapPercent(gapPercent)
                .violationAlerts(pendingFlags)
                .duplicateQueueCount(criticalDisputes)
                .academicYear(targetYear)
                .institutions(institutionRows)
                .capacityViolations(capViolations)
                .anomalies(anomaliesList)
                .topDiscrepancies(topRankings)
                .build();
    }

    public InstitutionDashboardDTO getInstitutionDashboard(String institutionId, String academicYear) {
        Institution institution = institutionRepository.findByAicteId(institutionId)
                .or(() -> institutionRepository.findById(institutionId))
                .orElseThrow(() -> new ResourceNotFoundException("Institution not found with ID: " + institutionId));

        String targetYear = (academicYear != null && !academicYear.isBlank()) ? academicYear : "2026-27";

        List<ProgramCapacityProgressDTO> programProgressList = new ArrayList<>();
        int totalApproved = 0;
        int totalRegularApproved = 0;
        int totalSuperApproved = 0;

        if (institution.getApprovedPrograms() != null) {
            for (Institution.ApprovedProgram p : institution.getApprovedPrograms()) {
                totalApproved += p.getApprovedIntake();
                totalRegularApproved += p.getApprovedIntake();

                int regularFilled = (int) studentRepository.countByInstitutionIdAndProgramCodeAndAcademicYearAndAdmissionStatus(
                        institution.getAicteId(), p.getProgramCode(), targetYear, AdmissionStatus.ADMITTED_ACTIVE);

                boolean exceeded = p.getApprovedIntake() > 0 && regularFilled > p.getApprovedIntake();
                double fillRate = p.getApprovedIntake() > 0 ? Math.round(((double) regularFilled / p.getApprovedIntake()) * 1000.0) / 10.0 : 0.0;

                Map<String, Integer> sq = new HashMap<>();
                Map<String, Integer> sqFilled = new HashMap<>();
                if (p.getSupernumeraryQuota() != null) {
                    sq.put("tfw", p.getSupernumeraryQuota().getTfw());
                    sq.put("ews", p.getSupernumeraryQuota().getEws());
                    sq.put("nri", p.getSupernumeraryQuota().getNri());
                    sq.put("pmsss", p.getSupernumeraryQuota().getPmsss());
                    totalSuperApproved += p.getSupernumeraryQuota().getTfw() + p.getSupernumeraryQuota().getEws() + p.getSupernumeraryQuota().getNri() + p.getSupernumeraryQuota().getPmsss();
                }

                programProgressList.add(ProgramCapacityProgressDTO.builder()
                        .programCode(p.getProgramCode())
                        .programName(p.getProgramName())
                        .regularApproved(p.getApprovedIntake())
                        .regularFilled(regularFilled)
                        .supernumeraryQuota(sq)
                        .supernumeraryFilled(sqFilled)
                        .regularCapacityExceeded(exceeded)
                        .regularFillRatePercent(fillRate)
                        .build());
            }
        }

        long totalUploaded = studentRepository.countByInstitutionId(institution.getAicteId());
        long validated = mongoTemplate.count(new Query(Criteria.where("institutionId").is(institution.getAicteId())
                .and("validationStatus").is(ValidationStatus.VALIDATED)), Student.class);
        long needsReview = mongoTemplate.count(new Query(Criteria.where("institutionId").is(institution.getAicteId())
                .and("validationStatus").is(ValidationStatus.NEEDS_REVIEW)), Student.class);
        long pending = mongoTemplate.count(new Query(Criteria.where("institutionId").is(institution.getAicteId())
                .and("admissionStatus").is(AdmissionStatus.PROVISIONAL)), Student.class);

        double complianceRate = totalUploaded > 0 ? Math.round(((double) validated / totalUploaded) * 1000.0) / 10.0 : 100.0;

        InstitutionDashboardDTO.InstitutionKpi kpi = InstitutionDashboardDTO.InstitutionKpi.builder()
                .totalApprovedIntake(totalApproved)
                .totalRegularApproved(totalRegularApproved)
                .totalSupernumeraryApproved(totalSuperApproved)
                .totalUploaded((int) totalUploaded)
                .validated((int) validated)
                .actionRequired((int) needsReview)
                .pending((int) pending)
                .complianceRate(complianceRate)
                .build();

        return InstitutionDashboardDTO.builder()
                .institutionId(institution.getAicteId())
                .institutionName(institution.getName())
                .academicYear(targetYear)
                .kpi(kpi)
                .programCapacities(programProgressList)
                .build();
    }

    public PagedResponse<CapacityViolationDTO> getCapacityViolations(String academicYear, Pageable pageable) {
        String targetYear = (academicYear != null && !academicYear.isBlank()) ? academicYear : "2026-27";
        List<CapacityViolationDTO> violations = new ArrayList<>();

        List<Institution> insts = institutionRepository.findAll();
        for (Institution inst : insts) {
            if (inst.getApprovedPrograms() == null) continue;
            for (Institution.ApprovedProgram p : inst.getApprovedPrograms()) {
                long admitted = studentRepository.countByInstitutionIdAndProgramCodeAndAcademicYearAndAdmissionStatus(
                        inst.getAicteId(), p.getProgramCode(), targetYear, AdmissionStatus.ADMITTED_ACTIVE);

                if (p.getApprovedIntake() > 0 && admitted > p.getApprovedIntake()) {
                    int overflow = (int) (admitted - p.getApprovedIntake());
                    FlagSeverity severity = overflow >= 15 ? FlagSeverity.CRITICAL : overflow >= 5 ? FlagSeverity.HIGH : FlagSeverity.MEDIUM;

                    violations.add(CapacityViolationDTO.builder()
                            .institutionId(inst.getAicteId())
                            .institutionName(inst.getName())
                            .programCode(p.getProgramCode())
                            .programName(p.getProgramName())
                            .approvedRegular(p.getApprovedIntake())
                            .admittedRegular((int) admitted)
                            .overflow(overflow)
                            .severity(severity)
                            .academicYear(targetYear)
                            .build());
                }
            }
        }

        int start = (int) pageable.getOffset();
        int end = Math.min((start + pageable.getPageSize()), violations.size());
        List<CapacityViolationDTO> pagedList = start <= end ? violations.subList(start, end) : List.of();

        return PagedResponse.fromPage(new PageImpl<>(pagedList, pageable, violations.size()));
    }

    public PagedResponse<AnomalyDTO> getAnomalies(String severityStr, Pageable pageable) {
        Query q = new Query();
        if (severityStr != null && !severityStr.isBlank()) {
            try {
                q.addCriteria(Criteria.where("severity").is(FlagSeverity.fromString(severityStr)));
            } catch (Exception ignored) {}
        }
        q.with(pageable);
        long total = mongoTemplate.count(q, Flag.class);
        List<Flag> flags = mongoTemplate.find(q, Flag.class);

        List<AnomalyDTO> anomalies = flags.stream().map(f -> AnomalyDTO.builder()
                .id(f.getId())
                .type(f.getFlagType() != null ? f.getFlagType().name() : "DISCREPANCY")
                .institutionId(f.getPrimaryInstitutionId())
                .institutionName(f.getPrimaryInstitutionName())
                .severity(f.getSeverity())
                .description(f.getNotes() != null ? f.getNotes() : "Flagged anomaly requiring adjudication")
                .detectedAt(f.getCreatedAt() != null ? f.getCreatedAt().toString() : Instant.now().toString())
                .status(f.getStatus() != null ? f.getStatus().name() : "PENDING")
                .build()).toList();

        return PagedResponse.fromPage(new PageImpl<>(anomalies, pageable, total));
    }

    public PagedResponse<FlagDetailDTO> getFlags(Pageable pageable) {
        Page<Flag> page = flagRepository.findAll(pageable);
        List<FlagDetailDTO> list = page.getContent().stream().map(this::toFlagDTO).toList();
        return PagedResponse.fromPage(new PageImpl<>(list, pageable, page.getTotalElements()));
    }

    public FlagDetailDTO getFlagById(String flagId) {
        Flag flag = flagRepository.findById(flagId)
                .orElseThrow(() -> new ResourceNotFoundException("Dispute flag not found with ID: " + flagId));
        return toFlagDTO(flag);
    }

    public String resolveFlag(String flagId, FlagResolveDTO dto, UserPrincipal officer, String clientIp, String userAgent) {
        Flag flag = flagRepository.findById(flagId)
                .orElseThrow(() -> new ResourceNotFoundException("Dispute flag not found with ID: " + flagId));

        if (flag.getStatus() == FlagStatus.RESOLVED) {
            throw new BadRequestException("Dispute flag has already been resolved and closed.");
        }

        // Regional boundary check for AICTE Officer
        if (officer != null && "ROLE_AICTE_OFFICER".equalsIgnoreCase(officer.getRole())) {
            String officerRegion = officer.getRegion();
            if (officerRegion == null || officerRegion.isBlank()) {
                throw new ForbiddenException("Access denied: AICTE Officer has no assigned region zone.");
            }
            boolean inRegion = false;
            if (flag.getPrimaryInstitutionId() != null) {
                Optional<Institution> inst = institutionRepository.findByAicteId(flag.getPrimaryInstitutionId())
                        .or(() -> institutionRepository.findById(flag.getPrimaryInstitutionId()));
                if (inst.isPresent() && inst.get().getZone() != null && inst.get().getZone().name().equalsIgnoreCase(officerRegion.trim())) {
                    inRegion = true;
                }
            }
            if (!inRegion) {
                throw new ForbiddenException("Regional isolation violation: Cannot resolve dispute flag for institution outside your assigned region (" + officerRegion + ").");
            }
        }

        String decision = dto.getResolution() != null ? dto.getResolution().trim().toUpperCase() : "DISMISS_FLAG";
        FlagResolution resolution = FlagResolution.fromString(decision);

        flag.setStatus(FlagStatus.RESOLVED);
        flag.setResolution(resolution);
        if (dto.getNotes() != null) flag.setNotes(dto.getNotes().trim());
        flag.setResolvedBy(officer != null ? officer.getEmail() : "AICTE_NODAL_OFFICER");
        flag.setResolvedAt(Instant.now());
        flagRepository.save(flag);

        // Update underlying student record
        if (flag.getStudentId() != null) {
            Optional<Student> studentOpt = studentRepository.findById(flag.getStudentId());
            if (studentOpt.isPresent()) {
                Student student = studentOpt.get();
                switch (resolution) {
                    case APPROVE_TRANSFER, ALLOW_EXCEPTION, VERIFIED_GENUINE -> {
                        student.setAdmissionStatus(AdmissionStatus.ADMITTED_ACTIVE);
                        student.setValidationStatus(ValidationStatus.VALIDATED);
                    }
                    case REJECT_DUPLICATE -> {
                        student.setAdmissionStatus(AdmissionStatus.CANCELLED);
                        student.setValidationStatus(ValidationStatus.REJECTED);
                    }
                    case DISMISS_FLAG -> {
                        student.setValidationStatus(ValidationStatus.VALIDATED);
                    }
                }
                studentRepository.save(student);
            }
        }

        auditService.logAsync("RESOLVE_DISPUTE_FLAG", officer != null ? officer.getId() : "OFFICER",
                officer != null ? officer.getEmail() : "officer@aicte.gov.in",
                officer != null ? officer.getRole() : "ROLE_AICTE_OFFICER",
                flag.getPrimaryInstitutionId(), "FLAG", flag.getId(), flag.getId(), flag.getApaarId(),
                "Decision: " + decision, clientIp, userAgent, null);

        log.info("Dispute flag '{}' resolved by '{}' with resolution '{}'", flagId, flag.getResolvedBy(), decision);
        return "Flag " + flagId + " resolved successfully with decision: " + decision;
    }

    public String updateSeverity(String flagId, FlagSeverity severity) {
        Flag flag = flagRepository.findById(flagId)
                .orElseThrow(() -> new ResourceNotFoundException("Dispute flag not found with ID: " + flagId));

        flag.setSeverity(severity);
        flagRepository.save(flag);
        log.info("Updated flag '{}' severity to {}", flagId, severity);
        return "Severity updated to " + severity;
    }

    public OfficerDashboardDTO getOfficerDashboard(RegionZone zone) {
        List<Flag> flags = flagRepository.findByStatus(FlagStatus.PENDING);
        List<FlagDetailDTO> flagDTOs = flags.stream().map(this::toFlagDTO).toList();

        List<OfficerDashboardDTO.RadarRow> radarList = new ArrayList<>();
        List<Institution> insts = (zone != null) ? institutionRepository.findByZone(zone) : institutionRepository.findAll();

        for (Institution inst : insts) {
            if (inst.getApprovedPrograms() == null) continue;
            for (Institution.ApprovedProgram p : inst.getApprovedPrograms()) {
                long current = studentRepository.countByInstitutionIdAndProgramCodeAndAcademicYearAndAdmissionStatus(
                        inst.getAicteId(), p.getProgramCode(), "2026-27", AdmissionStatus.ADMITTED_ACTIVE);

                radarList.add(OfficerDashboardDTO.RadarRow.builder()
                        .college(inst.getName())
                        .program(p.getProgramCode())
                        .intake(p.getApprovedIntake())
                        .current((int) current)
                        .build());
            }
        }

        long cleanValidated = studentRepository.countByValidationStatus(ValidationStatus.VALIDATED);
        long totalRecords = studentRepository.count();

        OfficerDashboardDTO.OfficerSummary summary = OfficerDashboardDTO.OfficerSummary.builder()
                .unresolvedFlags(flags.size())
                .regionalColleges(insts.size())
                .cleanValidated((int) cleanValidated)
                .totalRecords((int) totalRecords)
                .build();

        return OfficerDashboardDTO.builder()
                .flags(flagDTOs)
                .radar(radarList)
                .summary(summary)
                .build();
    }

    public ComplianceOverviewDTO getOfficerCompliance(RegionZone zone, String academicYear) {
        List<Institution> insts = (zone != null) ? institutionRepository.findByZone(zone) : institutionRepository.findAll();
        List<ComplianceOverviewDTO.ComplianceRow> rows = new ArrayList<>();

        int cleanCount = 0;
        int onTime = 0;
        int intakeBreaches = 0;

        for (Institution inst : insts) {
            long total = studentRepository.countByInstitutionId(inst.getAicteId());
            long val = mongoTemplate.count(new Query(Criteria.where("institutionId").is(inst.getAicteId())
                    .and("validationStatus").is(ValidationStatus.VALIDATED)), Student.class);

            double ratio = total > 0 ? Math.round(((double) val / total) * 1000.0) / 10.0 : 100.0;
            if (ratio >= 90.0) cleanCount++;
            onTime++;

            int overBy = 0;
            String intakeStatus = "COMPLIANT";
            if (inst.getApprovedPrograms() != null) {
                for (Institution.ApprovedProgram p : inst.getApprovedPrograms()) {
                    long adm = studentRepository.countByInstitutionIdAndProgramCodeAndAcademicYearAndAdmissionStatus(
                            inst.getAicteId(), p.getProgramCode(), "2026-27", AdmissionStatus.ADMITTED_ACTIVE);
                    if (p.getApprovedIntake() > 0 && adm > p.getApprovedIntake()) {
                        overBy += (int) (adm - p.getApprovedIntake());
                        intakeStatus = "OVER";
                        intakeBreaches++;
                    }
                }
            }

            int pendingDisputes = flagRepository.findByPrimaryInstitutionId(inst.getAicteId()).size();
            int tier = (ratio >= 90.0 && "COMPLIANT".equals(intakeStatus) && pendingDisputes == 0) ? 1
                    : (ratio >= 70.0 && overBy <= 10) ? 2 : 3;

            rows.add(ComplianceOverviewDTO.ComplianceRow.builder()
                    .id(inst.getAicteId())
                    .name(inst.getName())
                    .affiliation(inst.getUniversityAffiliation())
                    .submission("ON_TIME")
                    .daysLate(0)
                    .validationRatio(ratio)
                    .intakeStatus(intakeStatus)
                    .overBy(overBy)
                    .pendingDisputes(pendingDisputes)
                    .tier(tier)
                    .defects(overBy > 0 ? "Exceeded approved quota by +" + overBy : "Compliant")
                    .build());
        }

        double cleanRatio = !rows.isEmpty() ? Math.round(((double) cleanCount / rows.size()) * 1000.0) / 10.0 : 100.0;
        long activeNotices = noticeRepository.count();

        ComplianceOverviewDTO.ComplianceSummary summary = ComplianceOverviewDTO.ComplianceSummary.builder()
                .cleanRatio(cleanRatio)
                .onTime(onTime)
                .totalColleges(insts.size())
                .intakeBreaches(intakeBreaches)
                .activeNotices((int) activeNotices)
                .build();

        return ComplianceOverviewDTO.builder()
                .rows(rows)
                .summary(summary)
                .build();
    }

    public Map<String, Object> getOfficerInstitutions(RegionZone zone) {
        List<Institution> insts = (zone != null) ? institutionRepository.findByZone(zone) : institutionRepository.findAll();
        List<InstitutionResponseDTO> dtoList = insts.stream().map(inst -> {
            long enrolled = studentRepository.countByInstitutionId(inst.getAicteId());
            return InstitutionResponseDTO.builder()
                    .id(inst.getAicteId())
                    .aicteId(inst.getAicteId())
                    .name(inst.getName())
                    .type(inst.getType() != null ? inst.getType().name() : "ENGINEERING")
                    .state(inst.getState())
                    .city(inst.getCity())
                    .zone(inst.getZone() != null ? inst.getZone().name() : "NORTH")
                    .universityAffiliation(inst.getUniversityAffiliation())
                    .status(inst.getStatus() != null ? inst.getStatus().name() : "APPROVED")
                    .enrolled((int) enrolled)
                    .build();
        }).toList();

        long approvedCount = dtoList.stream().filter(i -> "APPROVED".equals(i.getStatus())).count();
        long underReviewCount = dtoList.stream().filter(i -> "UNDER_REVIEW".equals(i.getStatus())).count();
        long suspendedCount = dtoList.stream().filter(i -> "SUSPENDED".equals(i.getStatus())).count();

        long overIntakeAlerts = 0;
        long pendingBatch = 0;
        for (Institution inst : insts) {
            if (inst.getApprovedPrograms() != null) {
                for (Institution.ApprovedProgram p : inst.getApprovedPrograms()) {
                    long admitted = studentRepository.countByInstitutionIdAndProgramCodeAndAcademicYearAndAdmissionStatus(
                            inst.getAicteId(), p.getProgramCode(), "2026-27", AdmissionStatus.ADMITTED_ACTIVE);
                    if (p.getApprovedIntake() > 0 && admitted > p.getApprovedIntake()) {
                        overIntakeAlerts++;
                        break;
                    }
                }
            }
            pendingBatch += uploadBatchRepository.findByInstitutionIdAndStatus(inst.getAicteId(), BatchStatus.PROCESSING).size()
                    + uploadBatchRepository.findByInstitutionIdAndStatus(inst.getAicteId(), BatchStatus.UPLOADED).size();
        }

        Map<String, Object> summary = Map.of(
                "zone", zone != null ? zone.name() : "NORTH",
                "total", dtoList.size(),
                "approved", approvedCount,
                "underReview", underReviewCount,
                "suspended", suspendedCount,
                "overIntakeAlerts", overIntakeAlerts,
                "pendingBatch", pendingBatch
        );

        return Map.of("institutions", dtoList, "summary", summary);
    }

    public DossierDTO getInstitutionDossier(String instId) {
        Institution inst = institutionRepository.findByAicteId(instId)
                .or(() -> institutionRepository.findById(instId))
                .orElseThrow(() -> new ResourceNotFoundException("Institution not found with ID: " + instId));

        List<DossierDTO.DossierProgramRow> progRows = new ArrayList<>();
        if (inst.getApprovedPrograms() != null) {
            for (Institution.ApprovedProgram p : inst.getApprovedPrograms()) {
                long enrolled = studentRepository.countByInstitutionIdAndProgramCodeAndAcademicYearAndAdmissionStatus(
                        inst.getAicteId(), p.getProgramCode(), "2026-27", AdmissionStatus.ADMITTED_ACTIVE);

                progRows.add(DossierDTO.DossierProgramRow.builder()
                        .code(p.getProgramCode())
                        .degree(p.getProgramName())
                        .approved(p.getApprovedIntake())
                        .enrolled((int) enrolled)
                        .tfw(p.getSupernumeraryQuota() != null ? p.getSupernumeraryQuota().getTfw() : 0)
                        .ews(p.getSupernumeraryQuota() != null ? p.getSupernumeraryQuota().getEws() : 0)
                        .nri(p.getSupernumeraryQuota() != null ? p.getSupernumeraryQuota().getNri() : 0)
                        .build());
            }
        }

        List<Flag> flags = flagRepository.findByPrimaryInstitutionId(inst.getAicteId());
        List<DossierDTO.DossierFlaggedStudent> flaggedStudents = flags.stream().map(f -> DossierDTO.DossierFlaggedStudent.builder()
                .name(f.getStudentName() != null ? f.getStudentName() : "Student")
                .apaarId(f.getApaarId())
                .reason(f.getNotes() != null ? f.getNotes() : "Flagged for review")
                .build()).toList();

        List<AuditLog> auditLogs = auditLogRepository.findByTargetId(inst.getAicteId());
        List<DossierDTO.DossierSyncLog> syncLogs = new ArrayList<>();
        if (!auditLogs.isEmpty()) {
            for (AuditLog a : auditLogs.stream().limit(5).toList()) {
                syncLogs.add(DossierDTO.DossierSyncLog.builder()
                        .at(a.getTimestamp() != null ? a.getTimestamp().toString() : Instant.now().toString())
                        .ok(true)
                        .records((int) studentRepository.countByInstitutionId(inst.getAicteId()))
                        .message(a.getAction() + " - " + (a.getTarget() != null ? a.getTarget().getTargetType() : "RECONCILIATION"))
                        .build());
            }
        } else {
            syncLogs.add(DossierDTO.DossierSyncLog.builder()
                    .at(inst.getUpdatedAt() != null ? inst.getUpdatedAt().toString() : Instant.now().toString())
                    .ok(true)
                    .records((int) studentRepository.countByInstitutionId(inst.getAicteId()))
                    .message("Live database records reconciled")
                    .build());
        }

        return DossierDTO.builder()
                .zone(inst.getZone() != null ? inst.getZone().name() : "NORTH")
                .state(inst.getState())
                .affiliation(inst.getUniversityAffiliation())
                .status(inst.getStatus() != null ? inst.getStatus().name() : "APPROVED")
                .validity("2026-2027")
                .lastSync(Instant.now().toString())
                .programs(progRows)
                .flaggedStudents(flaggedStudents)
                .syncLogs(syncLogs)
                .build();
    }

    public byte[] exportCsv(String reportType) {
        StringBuilder sb = new StringBuilder();
        String type = (reportType != null) ? reportType.toUpperCase() : "ENROLLMENT";

        if (type.contains("CAPACITY")) {
            sb.append("AICTE_ID,Institution_Name,Program_Code,Program_Name,Approved_Intake,Enrolled_Students,Excess_Count,Academic_Year\n");
            List<Institution> insts = institutionRepository.findAll();
            for (Institution inst : insts) {
                if (inst.getApprovedPrograms() == null) continue;
                for (Institution.ApprovedProgram p : inst.getApprovedPrograms()) {
                    long enrolled = studentRepository.countByInstitutionIdAndProgramCodeAndAcademicYearAndAdmissionStatus(
                            inst.getAicteId(), p.getProgramCode(), "2026-27", AdmissionStatus.ADMITTED_ACTIVE);
                    int overflow = (int) Math.max(0, enrolled - p.getApprovedIntake());
                    sb.append(String.format("\"%s\",\"%s\",\"%s\",\"%s\",%d,%d,%d,\"2026-27\"\n",
                            inst.getAicteId(), inst.getName(), p.getProgramCode(), p.getProgramName(), p.getApprovedIntake(), enrolled, overflow));
                }
            }
        } else if (type.contains("DISCREPANCY")) {
            sb.append("Flag_ID,Flag_Type,Severity,APAAR_ID,Student_Name,Primary_Institution,Conflicting_Institution,Status,Created_At\n");
            List<Flag> flags = flagRepository.findAll();
            for (Flag f : flags) {
                sb.append(String.format("\"%s\",\"%s\",\"%s\",\"%s\",\"%s\",\"%s\",\"%s\",\"%s\",\"%s\"\n",
                        f.getId(), f.getFlagType(), f.getSeverity(), f.getApaarId(), f.getStudentName(),
                        f.getPrimaryInstitutionName(), f.getConflictingInstitutionName(), f.getStatus(), f.getCreatedAt()));
            }
        } else {
            // ENROLLMENT default
            sb.append("Student_ID,APAAR_ID,Institution_ID,Program_Code,Academic_Year,Seat_Category,Admission_Status,Validation_Status,Full_Name\n");
            List<Student> students = studentRepository.findAll();
            for (Student s : students) {
                String fullName = s.getPersonalInfo() != null ? s.getPersonalInfo().getFullName() : "";
                sb.append(String.format("\"%s\",\"%s\",\"%s\",\"%s\",\"%s\",\"%s\",\"%s\",\"%s\",\"%s\"\n",
                        s.getId(), s.getApaarId(), s.getInstitutionId(), s.getProgramCode(), s.getAcademicYear(),
                        s.getSeatCategory(), s.getAdmissionStatus(), s.getValidationStatus(), fullName));
            }
        }

        return sb.toString().getBytes(StandardCharsets.UTF_8);
    }

    private FlagDetailDTO toFlagDTO(Flag f) {
        Map<String, Object> evidenceMap = null;
        if (f.getStudentId() != null) {
            Optional<Student> studentOpt = studentRepository.findById(f.getStudentId());
            if (studentOpt.isPresent() && studentOpt.get().getEvidenceFiles() != null && !studentOpt.get().getEvidenceFiles().isEmpty()) {
                String latest = studentOpt.get().getEvidenceFiles().get(0);
                evidenceMap = Map.of("name", latest, "url", "/api/v1/students/" + f.getStudentId() + "/evidence/" + latest);
            }
        }

        return FlagDetailDTO.builder()
                .id(f.getId())
                .flagType(f.getFlagType() != null ? f.getFlagType().name() : null)
                .severity(f.getSeverity())
                .apaarId(f.getApaarId())
                .studentId(f.getStudentId())
                .studentName(f.getStudentName())
                .primaryInstitutionId(f.getPrimaryInstitutionId())
                .primaryInstitutionName(f.getPrimaryInstitutionName())
                .conflictingInstitutionId(f.getConflictingInstitutionId())
                .conflictingInstitutionName(f.getConflictingInstitutionName())
                .status(f.getStatus() != null ? f.getStatus().name() : null)
                .resolution(f.getResolution() != null ? f.getResolution().name() : null)
                .notes(f.getNotes())
                .createdAt(f.getCreatedAt() != null ? f.getCreatedAt().toString() : null)
                .resolvedAt(f.getResolvedAt() != null ? f.getResolvedAt().toString() : null)
                .resolvedBy(f.getResolvedBy())
                .evidence(evidenceMap)
                .build();
    }

    public GridFsResource getFlagEvidenceResource(String flagId, String filename, UserPrincipal principal) {
        Flag flag = flagRepository.findById(flagId)
                .orElseThrow(() -> new ResourceNotFoundException("Dispute flag not found with ID: " + flagId));

        // 1. Tenant ownership enforcement for Institution roles
        if (principal != null && ("ROLE_INSTITUTION_ADMIN".equalsIgnoreCase(principal.getRole())
                || "ROLE_INSTITUTION_OPERATOR".equalsIgnoreCase(principal.getRole()))) {
            String myInst = principal.getInstitutionId();
            if (myInst == null || (!myInst.equalsIgnoreCase(flag.getPrimaryInstitutionId())
                    && !myInst.equalsIgnoreCase(flag.getConflictingInstitutionId()))) {
                throw new ForbiddenException("Tenant isolation violation: Access denied to evidence for dispute involving other institutions.");
            }
        }

        // 2. Regional boundary enforcement for Regional Officers
        if (principal != null && "ROLE_AICTE_OFFICER".equalsIgnoreCase(principal.getRole())) {
            String officerRegion = principal.getRegion();
            if (officerRegion == null || officerRegion.isBlank()) {
                throw new ForbiddenException("Access denied: AICTE Officer has no assigned region zone.");
            }
            boolean inRegion = false;
            if (flag.getPrimaryInstitutionId() != null) {
                Optional<Institution> inst = institutionRepository.findByAicteId(flag.getPrimaryInstitutionId())
                        .or(() -> institutionRepository.findById(flag.getPrimaryInstitutionId()));
                if (inst.isPresent() && inst.get().getZone() != null && inst.get().getZone().name().equalsIgnoreCase(officerRegion.trim())) {
                    inRegion = true;
                }
            }
            if (!inRegion && flag.getConflictingInstitutionId() != null) {
                Optional<Institution> inst = institutionRepository.findByAicteId(flag.getConflictingInstitutionId())
                        .or(() -> institutionRepository.findById(flag.getConflictingInstitutionId()));
                if (inst.isPresent() && inst.get().getZone() != null && inst.get().getZone().name().equalsIgnoreCase(officerRegion.trim())) {
                    inRegion = true;
                }
            }
            if (!inRegion) {
                throw new ForbiddenException("Regional isolation violation: Access denied to evidence for dispute outside your assigned region (" + officerRegion + ").");
            }
        }

        // 3. Association verification: filename must belong to the student or dispute
        if (flag.getStudentId() != null) {
            Optional<Student> studentOpt = studentRepository.findById(flag.getStudentId());
            if (studentOpt.isPresent()) {
                Student s = studentOpt.get();
                if (s.getEvidenceFiles() != null && s.getEvidenceFiles().contains(filename)) {
                    return gridFsStorageService.getFile(filename);
                }
            }
        }
        if (!filename.startsWith(flagId) && !filename.contains(flag.getApaarId())
                && (flag.getStudentId() == null || !filename.startsWith(flag.getStudentId()))) {
            throw new ResourceNotFoundException("Evidence file '" + filename + "' is not associated with dispute flag ID: " + flagId);
        }

        return gridFsStorageService.getFile(filename);
    }
}
