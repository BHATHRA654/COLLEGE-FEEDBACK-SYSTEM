package com.collegefeedback.controller;

import com.collegefeedback.dto.JwtResponse;
import com.collegefeedback.dto.LoginRequest;
import com.collegefeedback.dto.RegisterRequest;
import com.collegefeedback.response.ApiResponse;
import com.collegefeedback.service.AuthenticationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Tag(name = "Authentication", description = "Endpoints for User Registration and Login")
public class AuthenticationController {

    private final AuthenticationService authService;

    @PostMapping("/register")
    @Operation(summary = "Register a new user")
    public ResponseEntity<ApiResponse<JwtResponse>> register(
            @Valid @RequestBody RegisterRequest request
    ) {
        JwtResponse response = authService.register(request);
        return ResponseEntity.ok(ApiResponse.<JwtResponse>builder()
                .success(true)
                .message("Registration Successful")
                .data(response)
                .build());
    }

    @PostMapping("/login")
    @Operation(summary = "Authenticate user and get JWT")
    public ResponseEntity<ApiResponse<JwtResponse>> login(
            @Valid @RequestBody LoginRequest request
    ) {
        JwtResponse response = authService.login(request);
        return ResponseEntity.ok(ApiResponse.<JwtResponse>builder()
                .success(true)
                .message("Login Successful")
                .data(response)
                .build());
    }
}
