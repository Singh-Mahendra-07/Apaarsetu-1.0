package com.apaarsetu.service;

import com.apaarsetu.common.dto.PagedResponse;
import com.apaarsetu.common.exception.BadRequestException;
import com.apaarsetu.common.exception.DuplicateEnrollmentException;
import com.apaarsetu.common.exception.ResourceNotFoundException;
import com.apaarsetu.domain.Institution;
import com.apaarsetu.domain.enums.InstitutionStatus;
import com.apaarsetu.domain.enums.InstitutionType;
import com.apaarsetu.domain.enums.RegionZone;
import com.apaarsetu.dto.*;
import com.apaarsetu.repository.InstitutionRepository;
import com.apaarsetu.repository.StudentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.time.Instant;
import java.util.*;

/**
 * ============================================================================
 * APAARSetu National Registry System — Backend Core Component
 * ============================================================================
 * File: InstitutionService.java
 * Package: com.apaarsetu.service
 * Component: InstitutionService (class)
 *
 * REASON & ARCHITECTURAL PURPOSE:
 * Manages institution registration, program intake updates, accreditation monitoring, and ERP API key generation.
 *
 * WORKING & FUNCTIONAL FLOW:
 * 1. Handles CRUD operations for higher education institutions.
 * 2. Manages approved academic programs, allowed intake, and supernumerary quotas (EWS, TFW, Sports).
 * 3. Issues cryptographically secure ERP API keys and stores their SHA-256 hashes.
 * ============================================================================
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class InstitutionService {

    private final InstitutionRepository institutionRepository;
    private final StudentRepository studentRepository;
    private final PasswordEncoder passwordEncoder;
    private final MongoTemplate mongoTemplate;
    private final SecureRandom secureRandom = new SecureRandom();

    public InstitutionResponseDTO createInstitution(CreateInstitutionDTO dto) {
        String aicteId = dto.getAicteId().trim().toUpperCase();
        if (institutionRepository.existsByAicteId(aicteId)) {
            throw new DuplicateEnrollmentException("Institution with AICTE ID '" + aicteId + "' already exists");
        }

        List<Institution.ApprovedProgram> programs = new ArrayList<>();
        if (dto.getApprovedPrograms() != null) {
            for (ApprovedProgramDTO p : dto.getApprovedPrograms()) {
                Institution.SupernumeraryQuota sq = new Institution.SupernumeraryQuota();
                if (p.getSupernumeraryQuota() != null) {
                    sq.setNri(p.getSupernumeraryQuota().getNri());
                    sq.setOciFn(p.getSupernumeraryQuota().getOciFn());
                    sq.setTfw(p.getSupernumeraryQuota().getTfw());
                    sq.setEws(p.getSupernumeraryQuota().getEws());
                    sq.setPmsss(p.getSupernumeraryQuota().getPmsss());
                }
                String code = p.getProgramCode() != null && !p.getProgramCode().isBlank()
                        ? p.getProgramCode().trim()
                        : (p.getCode() != null && !p.getCode().isBlank() ? p.getCode().trim() : "PROG-101");
                String name = p.getProgramName() != null && !p.getProgramName().isBlank()
                        ? p.getProgramName().trim()
                        : (p.getName() != null && !p.getName().isBlank() ? p.getName().trim() : code + " Program");

                programs.add(Institution.ApprovedProgram.builder()
                        .programCode(code)
                        .programName(name)
                        .level(p.getLevel() != null ? p.getLevel() : "UG")
                        .duration(p.getDuration() > 0 ? p.getDuration() : 4)
                        .approvedIntake(p.getApprovedIntake() > 0 ? p.getApprovedIntake() : p.getIntake())
                        .academicYear(p.getAcademicYear() != null ? p.getAcademicYear() : "2026-27")
                        .supernumeraryQuota(sq)
                        .build());
            }
        }

        Institution inst = Institution.builder()
                .aicteId(aicteId)
                .name(dto.getName().trim())
                .type(parseEnum(InstitutionType.class, dto.getType(), InstitutionType.ENGINEERING))
                .state(dto.getState().trim())
                .city(dto.getCity().trim())
                .zone(parseEnum(RegionZone.class, dto.getZone(), RegionZone.NORTH))
                .universityAffiliation(dto.getUniversityAffiliation() != null ? dto.getUniversityAffiliation().trim() : "State Technical University")
                .status(parseEnum(InstitutionStatus.class, dto.getStatus(), InstitutionStatus.APPROVED))
                .approvedPrograms(programs)
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .build();

        Institution saved = institutionRepository.save(inst);
        log.info("Registered new institution '{}' with ID: {}", saved.getAicteId(), saved.getId());
        return toDTO(saved);
    }

    public PagedResponse<InstitutionResponseDTO> getInstitutions(String state,
                                                                String type,
                                                                String zone,
                                                                String status,
                                                                Pageable pageable) {

        Query query = new Query();

        if (state != null && !state.isBlank()) {
            query.addCriteria(Criteria.where("state").regex(java.util.regex.Pattern.quote(state.trim()), "i"));
        }
        if (type != null && !type.isBlank()) {
            try {
                query.addCriteria(Criteria.where("type").is(InstitutionType.valueOf(type.trim().toUpperCase())));
            } catch (Exception ignored) {}
        }
        if (zone != null && !zone.isBlank()) {
            try {
                query.addCriteria(Criteria.where("zone").is(RegionZone.valueOf(zone.trim().toUpperCase())));
            } catch (Exception ignored) {}
        }
        if (status != null && !status.isBlank()) {
            try {
                query.addCriteria(Criteria.where("status").is(InstitutionStatus.valueOf(status.trim().toUpperCase())));
            } catch (Exception ignored) {}
        }

        long total = mongoTemplate.count(query, Institution.class);
        query.with(pageable);
        List<Institution> list = mongoTemplate.find(query, Institution.class);

        List<InstitutionResponseDTO> dtoList = list.stream().map(this::toDTO).toList();
        return PagedResponse.fromPage(new PageImpl<>(dtoList, pageable, total));
    }

    public InstitutionResponseDTO getInstitutionById(String idOrAicteId) {
        Institution inst = findByIdOrAicteId(idOrAicteId);
        return toDTO(inst);
    }

    public InstitutionResponseDTO updateInstitution(String idOrAicteId, CreateInstitutionDTO dto) {
        Institution inst = findByIdOrAicteId(idOrAicteId);

        if (dto.getName() != null && !dto.getName().isBlank()) inst.setName(dto.getName().trim());
        if (dto.getType() != null && !dto.getType().isBlank()) inst.setType(parseEnum(InstitutionType.class, dto.getType(), inst.getType()));
        if (dto.getState() != null && !dto.getState().isBlank()) inst.setState(dto.getState().trim());
        if (dto.getCity() != null && !dto.getCity().isBlank()) inst.setCity(dto.getCity().trim());
        if (dto.getZone() != null && !dto.getZone().isBlank()) inst.setZone(parseEnum(RegionZone.class, dto.getZone(), inst.getZone()));
        if (dto.getUniversityAffiliation() != null && !dto.getUniversityAffiliation().isBlank()) inst.setUniversityAffiliation(dto.getUniversityAffiliation().trim());
        if (dto.getStatus() != null && !dto.getStatus().isBlank()) inst.setStatus(parseEnum(InstitutionStatus.class, dto.getStatus(), inst.getStatus()));

        inst.setUpdatedAt(Instant.now());
        Institution saved = institutionRepository.save(inst);
        return toDTO(saved);
    }

    public InstitutionResponseDTO updateIntake(String idOrAicteId, String programCode, String academicYear, UpdateIntakeDTO dto) {
        Institution inst = findByIdOrAicteId(idOrAicteId);

        String targetProg = (dto.getProgramCode() != null && !dto.getProgramCode().isBlank()) ? dto.getProgramCode() : programCode;
        String targetYear = (dto.getAcademicYear() != null && !dto.getAcademicYear().isBlank()) ? dto.getAcademicYear() : academicYear;

        if (targetProg == null || targetProg.isBlank()) {
            throw new BadRequestException("Program code is required to update intake quotas");
        }

        if (inst.getApprovedPrograms() == null) {
            inst.setApprovedPrograms(new ArrayList<>());
        }

        Institution.ApprovedProgram existing = null;
        for (Institution.ApprovedProgram p : inst.getApprovedPrograms()) {
            if (targetProg.equalsIgnoreCase(p.getProgramCode())) {
                existing = p;
                break;
            }
        }

        Institution.SupernumeraryQuota sq = new Institution.SupernumeraryQuota();
        if (dto.getSupernumeraryQuota() != null) {
            sq.setNri(dto.getSupernumeraryQuota().getNri());
            sq.setOciFn(dto.getSupernumeraryQuota().getOciFn());
            sq.setTfw(dto.getSupernumeraryQuota().getTfw());
            sq.setEws(dto.getSupernumeraryQuota().getEws());
            sq.setPmsss(dto.getSupernumeraryQuota().getPmsss());
        }

        if (existing != null) {
            existing.setApprovedIntake(dto.getApprovedIntake());
            if (targetYear != null) existing.setAcademicYear(targetYear);
            existing.setSupernumeraryQuota(sq);
        } else {
            inst.getApprovedPrograms().add(Institution.ApprovedProgram.builder()
                    .programCode(targetProg)
                    .programName(targetProg + " Program")
                    .approvedIntake(dto.getApprovedIntake())
                    .academicYear(targetYear != null ? targetYear : "2026-27")
                    .supernumeraryQuota(sq)
                    .build());
        }

        inst.setUpdatedAt(Instant.now());
        Institution saved = institutionRepository.save(inst);
        log.info("Updated program '{}' intake to {} for institution '{}'", targetProg, dto.getApprovedIntake(), inst.getAicteId());
        return toDTO(saved);
    }

    public ApiKeyResponseDTO createApiKey(String idOrAicteId, String label) {
        Institution inst = findByIdOrAicteId(idOrAicteId);

        String keyId = "erp-" + UUID.randomUUID().toString().substring(0, 8);
        byte[] secretBytes = new byte[24];
        secureRandom.nextBytes(secretBytes);
        String rawSecret = HexFormat.of().formatHex(secretBytes);
        String rawApiKey = keyId + "." + rawSecret;

        String keyHash = passwordEncoder.encode(rawSecret);

        if (inst.getErpApiKeys() == null) {
            inst.setErpApiKeys(new ArrayList<>());
        }

        Institution.ErpApiKey newKey = Institution.ErpApiKey.builder()
                .keyId(keyId)
                .keyHash(keyHash)
                .label(label != null && !label.isBlank() ? label : "ERP Integration Key")
                .createdAt(Instant.now())
                .active(true)
                .build();

        inst.getErpApiKeys().add(newKey);
        institutionRepository.save(inst);

        log.info("Generated new ERP API key '{}' for institution '{}'", keyId, inst.getAicteId());

        return ApiKeyResponseDTO.builder()
                .keyId(keyId)
                .rawSecret(rawSecret)
                .rawApiKey(rawApiKey)
                .label(newKey.getLabel())
                .createdAt(newKey.getCreatedAt().toString())
                .active(true)
                .build();
    }

    public String revokeApiKey(String idOrAicteId, String keyId) {
        Institution inst = findByIdOrAicteId(idOrAicteId);
        boolean found = false;

        if (inst.getErpApiKeys() != null) {
            for (Institution.ErpApiKey key : inst.getErpApiKeys()) {
                if (keyId.equalsIgnoreCase(key.getKeyId())) {
                    key.setActive(false);
                    found = true;
                    break;
                }
            }
        }

        if (!found) {
            throw new ResourceNotFoundException("ERP API key '" + keyId + "' not found");
        }

        institutionRepository.save(inst);
        log.info("Revoked ERP API key '{}' for institution '{}'", keyId, inst.getAicteId());
        return "ERP API key " + keyId + " has been revoked.";
    }

    public List<ErpApiKeyDTO> listApiKeys(String idOrAicteId) {
        Institution inst = findByIdOrAicteId(idOrAicteId);
        if (inst.getErpApiKeys() == null) return List.of();

        return inst.getErpApiKeys().stream().map(k -> ErpApiKeyDTO.builder()
                .keyId(k.getKeyId())
                .label(k.getLabel())
                .createdAt(k.getCreatedAt() != null ? k.getCreatedAt().toString() : null)
                .lastUsedAt(k.getLastUsed() != null ? k.getLastUsed().toString() : null)
                .active(k.isActive())
                .build()).toList();
    }

    public Institution findByIdOrAicteId(String idOrAicteId) {
        return institutionRepository.findByAicteId(idOrAicteId)
                .or(() -> institutionRepository.findById(idOrAicteId))
                .orElseThrow(() -> new ResourceNotFoundException("Institution not found with identifier: " + idOrAicteId));
    }

    public InstitutionResponseDTO toDTO(Institution inst) {
        List<ApprovedProgramDTO> progDTOs = new ArrayList<>();
        if (inst.getApprovedPrograms() != null) {
            for (Institution.ApprovedProgram p : inst.getApprovedPrograms()) {
                SupernumeraryQuotaDTO sqDTO = new SupernumeraryQuotaDTO();
                if (p.getSupernumeraryQuota() != null) {
                    sqDTO.setNri(p.getSupernumeraryQuota().getNri());
                    sqDTO.setOciFn(p.getSupernumeraryQuota().getOciFn());
                    sqDTO.setTfw(p.getSupernumeraryQuota().getTfw());
                    sqDTO.setEws(p.getSupernumeraryQuota().getEws());
                    sqDTO.setPmsss(p.getSupernumeraryQuota().getPmsss());
                }
                progDTOs.add(ApprovedProgramDTO.builder()
                        .programCode(p.getProgramCode())
                        .programName(p.getProgramName())
                        .level(p.getLevel())
                        .duration(p.getDuration())
                        .approvedIntake(p.getApprovedIntake())
                        .academicYear(p.getAcademicYear())
                        .supernumeraryQuota(sqDTO)
                        .build());
            }
        }

        List<ErpApiKeyDTO> keyDTOs = new ArrayList<>();
        if (inst.getErpApiKeys() != null) {
            for (Institution.ErpApiKey k : inst.getErpApiKeys()) {
                keyDTOs.add(ErpApiKeyDTO.builder()
                        .keyId(k.getKeyId())
                        .label(k.getLabel())
                        .createdAt(k.getCreatedAt() != null ? k.getCreatedAt().toString() : null)
                        .lastUsedAt(k.getLastUsed() != null ? k.getLastUsed().toString() : null)
                        .active(k.isActive())
                        .build());
            }
        }

        long enrolled = studentRepository.countByInstitutionId(inst.getAicteId());

        return InstitutionResponseDTO.builder()
                .id(inst.getId())
                .aicteId(inst.getAicteId())
                .name(inst.getName())
                .type(inst.getType() != null ? inst.getType().name() : null)
                .state(inst.getState())
                .city(inst.getCity())
                .zone(inst.getZone() != null ? inst.getZone().name() : null)
                .universityAffiliation(inst.getUniversityAffiliation())
                .status(inst.getStatus() != null ? inst.getStatus().name() : "APPROVED")
                .approvedPrograms(progDTOs)
                .erpApiKeys(keyDTOs)
                .enrolled((int) enrolled)
                .description(inst.getDescription())
                .headName(inst.getHeadName())
                .headEmail(inst.getHeadEmail())
                .headPhone(inst.getHeadPhone())
                .headStatus(inst.getHeadStatus())
                .nodalOfficerName(inst.getNodalOfficerName())
                .nodalOfficerEmail(inst.getNodalOfficerEmail())
                .nodalOfficerPhone(inst.getNodalOfficerPhone())
                .nodalOfficerPrivileges(inst.getNodalOfficerPrivileges())
                .build();
    }

    private <E extends Enum<E>> E parseEnum(Class<E> enumClass, String value, E defaultValue) {
        if (value == null || value.isBlank()) return defaultValue;
        try {
            return Enum.valueOf(enumClass, value.trim().toUpperCase());
        } catch (Exception e) {
            return defaultValue;
        }
    }
}
