package com.apaarsetu.domain;

import com.apaarsetu.domain.enums.RegionZone;
import com.apaarsetu.domain.enums.UserRole;
import com.apaarsetu.domain.enums.UserStatus;
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

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "users")
public class User {

    @Id
    private String id;

    @Indexed(unique = true)
    private String email;

    @com.fasterxml.jackson.annotation.JsonIgnore
    private String passwordHash;

    @com.fasterxml.jackson.annotation.JsonIgnore
    private String secondaryPasswordHash;

    private String fullName;

    private UserRole role;

    @Indexed
    private String institutionId;

    private RegionZone region;

    private String phone;

    private String photoUrl;

    @Builder.Default
    private UserStatus status = UserStatus.ACTIVE;

    @Builder.Default
    private boolean mfaEnabled = false;

    @com.fasterxml.jackson.annotation.JsonIgnore
    private String mfaSecret;

    @com.fasterxml.jackson.annotation.JsonIgnore
    private Long lastTotpTimeStep;

    private Instant lastLogin;

    @com.fasterxml.jackson.annotation.JsonIgnore
    @Builder.Default
    private int failedLoginAttempts = 0;

    @Builder.Default
    private boolean requiresPasswordChange = false;

    @Builder.Default
    private boolean mustChangePassword = false;

    public boolean isRequiresPasswordChange() {
        return requiresPasswordChange || mustChangePassword;
    }

    public void setRequiresPasswordChange(boolean requiresPasswordChange) {
        this.requiresPasswordChange = requiresPasswordChange;
        this.mustChangePassword = requiresPasswordChange;
    }

    public boolean isMustChangePassword() {
        return requiresPasswordChange || mustChangePassword;
    }

    public void setMustChangePassword(boolean mustChangePassword) {
        this.mustChangePassword = mustChangePassword;
        this.requiresPasswordChange = mustChangePassword;
    }

    @CreatedDate
    @Builder.Default
    private Instant createdAt = Instant.now();

    @LastModifiedDate
    @Builder.Default
    private Instant updatedAt = Instant.now();
}
