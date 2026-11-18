package com.collegefeedback.service;

import com.collegefeedback.dto.JwtResponse;
import com.collegefeedback.dto.LoginRequest;
import com.collegefeedback.dto.RegisterRequest;

public interface AuthenticationService {
    JwtResponse register(RegisterRequest request);
    JwtResponse login(LoginRequest request);
}
