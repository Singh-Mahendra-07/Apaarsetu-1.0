package com.apaarsetu.controller;

import com.apaarsetu.common.dto.ApiResponse;
import com.apaarsetu.dto.ManualVerificationRequest;
import com.apaarsetu.dto.VerificationDisputeDTO;
import com.apaarsetu.dto.VerificationTokenDTO;
import com.apaarsetu.dto.VerifiedCredentialDTO;
import com.apaarsetu.security.UserPrincipal;
import com.apaarsetu.service.VerificationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Slf4j
@RestController
@RequestMapping("/verify")
@RequiredArgsConstructor
public class VerificationController {

    private final VerificationService verificationService;

    @GetMapping("/qr/{payload}")
    public ResponseEntity<ApiResponse<VerifiedCredentialDTO>> verifyQr(@PathVariable String payload) {
        VerifiedCredentialDTO response = verificationService.verifyQr(payload);
        return ResponseEntity.ok(ApiResponse.success("Cryptographic QR verification validated", response));
    }

    @PostMapping("/manual")
    public ResponseEntity<ApiResponse<VerifiedCredentialDTO>> verifyManual(
            @Valid @RequestBody ManualVerificationRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {

        VerifiedCredentialDTO response = verificationService.verifyManual(request, principal);
        return ResponseEntity.ok(ApiResponse.success("Demographic DPDP credential check validated", response));
    }

    @GetMapping("/history")
    public ResponseEntity<ApiResponse<List<VerificationTokenDTO>>> getHistory(@AuthenticationPrincipal UserPrincipal principal) {
        List<VerificationTokenDTO> response = verificationService.getHistory(principal);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping("/disputes")
    public ResponseEntity<ApiResponse<String>> submitDispute(
            @Valid @RequestBody VerificationDisputeDTO dto,
            @AuthenticationPrincipal UserPrincipal principal) {

        String message = verificationService.submitDispute(dto, principal);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(message, message));
    }
}
