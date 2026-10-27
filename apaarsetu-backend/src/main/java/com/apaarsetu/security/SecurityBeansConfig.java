package com.apaarsetu.security;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

/**
 * ============================================================================
 * APAARSetu National Registry System — Backend Core Component
 * ============================================================================
 * File: SecurityBeansConfig.java
 * Package: com.apaarsetu.security
 * Component: SecurityBeansConfig (class)
 *
 * REASON & ARCHITECTURAL PURPOSE:
 * Declares core Spring Security infrastructure beans (PasswordEncoder, AuthenticationManager, UserDetailsService).
 *
 * WORKING & FUNCTIONAL FLOW:
 * 1. Instantiates BCryptPasswordEncoder with recommended work factor for secure credential hashing.
 * 2. Exposes AuthenticationManager from Spring's AuthenticationConfiguration.
 * ============================================================================
 */
@Configuration
public class SecurityBeansConfig {

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
