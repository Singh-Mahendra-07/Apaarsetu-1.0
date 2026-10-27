package com.apaarsetu.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OfficialDTO {
    private String id;
    private String name;
    private String email;
    private String role;
    private String scope;
    private String zone;
    private String institutionId;
    private String status;
    private boolean verified;
    private String lastLogin;
}
