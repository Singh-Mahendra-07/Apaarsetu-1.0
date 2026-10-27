package com.apaarsetu.security;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.Collections;
import java.util.List;

/**
 * ============================================================================
 * APAARSetu National Registry System — Backend Core Component
 * ============================================================================
 * File: UserPrincipal.java
 * Package: com.apaarsetu.security
 * Component: UserPrincipal (class)
 *
 * REASON & ARCHITECTURAL PURPOSE:
 * Custom UserDetails implementation bridging the User domain entity to Spring Security's authentication context.
 *
 * WORKING & FUNCTIONAL FLOW:
 * 1. Implements org.springframework.security.core.userdetails.UserDetails.
 * 2. Provides user email, hashed password, granted authorities, institution affiliation, and account status flags.
 * 3. Injected into controller methods via @AuthenticationPrincipal.
 * ============================================================================
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserPrincipal implements UserDetails {

    private String id;
    private String email;
    private String password;
    private String fullName;
    private String role;
    private String institutionId;
    private String region;
    private String status;
    private boolean mfaEnabled;
    private boolean requiresPasswordChange;

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        if (role == null) {
            return Collections.emptyList();
        }
        String formattedRole = role.startsWith("ROLE_") ? role : "ROLE_" + role;
        return List.of(new SimpleGrantedAuthority(formattedRole));
    }

    @Override
    public String getPassword() {
        return this.password;
    }

    @Override
    public String getUsername() {
        return this.email;
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return !"LOCKED".equalsIgnoreCase(status);
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return !"SUSPENDED".equalsIgnoreCase(status);
    }
}
