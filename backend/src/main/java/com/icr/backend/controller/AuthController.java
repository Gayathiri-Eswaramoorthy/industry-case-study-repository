package com.icr.backend.controller;

import com.icr.backend.dto.request.LoginRequest;
import com.icr.backend.dto.request.RegisterRequest;
import com.icr.backend.service.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Tag(name = "Authentication")
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    @Operation(summary = "Register user")
    public String register(@RequestBody RegisterRequest request) {
        authService.register(request);
        return "User registered successfully";
    }

    @PostMapping("/login")
    @Operation(summary = "Login user")
    public String login(@RequestBody LoginRequest request) {
        return authService.login(request);
    }
}
