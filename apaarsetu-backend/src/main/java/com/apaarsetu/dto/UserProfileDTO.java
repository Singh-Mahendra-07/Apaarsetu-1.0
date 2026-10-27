package com.apaarsetu.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserProfileDTO {
    private String id;
    private String email;
    private String fullName;
    private String role;
    private String institutionId;
    private String institutionName;
    private String region;
    private String phone;
    private String photoUrl;
    private boolean mfaEnabled;
    private String lastLogin;
    private String status;
    private boolean requiresPasswordChange;

    @JsonProperty("userId")
    public String getUserId() {
        return this.id;
    }

    @JsonProperty("name")
    public String getName() {
        return this.fullName;
    }
}
