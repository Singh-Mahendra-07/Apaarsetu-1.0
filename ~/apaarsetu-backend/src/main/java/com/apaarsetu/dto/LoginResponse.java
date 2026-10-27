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
public class LoginResponse {
    private String accessToken;
    private String refreshToken;

    @Builder.Default
    private String tokenType = "Bearer";

    private long expiresIn;
    private long expiresInMs;
    private UserProfileDTO user;

    @Builder.Default
    private boolean mfaRequired = false;

    @Builder.Default
    private boolean requiresPasswordChange = false;

    private String userId;
    private String challengeToken;

    @JsonProperty("mfaToken")
    public String getMfaToken() {
        return this.challengeToken;
    }

    @JsonProperty("mfaChallengeToken")
    public String getMfaChallengeToken() {
        return this.challengeToken;
    }
}
