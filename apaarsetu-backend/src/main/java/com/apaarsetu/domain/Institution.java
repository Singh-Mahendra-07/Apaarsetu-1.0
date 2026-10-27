package com.apaarsetu.domain;

import com.apaarsetu.domain.enums.InstitutionStatus;
import com.apaarsetu.domain.enums.InstitutionType;
import com.apaarsetu.domain.enums.RegionZone;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "institutions")
public class Institution {

    @Id
    private String id;

    @Indexed(unique = true)
    private String aicteId;

    private String name;

    private InstitutionType type;

    @Indexed
    private String state;

    private String city;

    private RegionZone zone;

    private String universityAffiliation;

    @Builder.Default
    private InstitutionStatus status = InstitutionStatus.APPROVED;

    private String description;

    // Leadership & Nodal Authority
    private String headName;
    private String headEmail;
    private String headPhone;
    private String headStatus;

    private String nodalOfficerName;
    private String nodalOfficerEmail;
    private String nodalOfficerPhone;
    private String nodalOfficerPrivileges;

    @Builder.Default
    private List<ApprovedProgram> approvedPrograms = new ArrayList<>();

    @Builder.Default
    private List<ErpApiKey> erpApiKeys = new ArrayList<>();

    @CreatedDate
    @Builder.Default
    private Instant createdAt = Instant.now();

    @LastModifiedDate
    @Builder.Default
    private Instant updatedAt = Instant.now();

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ApprovedProgram {
        private String programCode;
        private String programName;
        private String level;
        private int duration;
        private int approvedIntake;
        private String academicYear;
        @Builder.Default
        private SupernumeraryQuota supernumeraryQuota = new SupernumeraryQuota();
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SupernumeraryQuota {
        @Builder.Default
        private int nri = 0;
        @Builder.Default
        private int ociFn = 0;
        @Builder.Default
        private int tfw = 0;
        @Builder.Default
        private int ews = 0;
        @Builder.Default
        private int pmsss = 0;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ErpApiKey {
        private String keyId;
        private String keyHash;
        private String label;
        @Builder.Default
        private Instant createdAt = Instant.now();
        private Instant lastUsed;
        @Builder.Default
        private boolean active = true;
    }
}
