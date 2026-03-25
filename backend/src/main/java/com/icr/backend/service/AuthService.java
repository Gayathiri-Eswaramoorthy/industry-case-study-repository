package com.icr.backend.service;

import com.icr.backend.dto.request.LoginRequest;
import com.icr.backend.dto.request.RegisterRequest;

public interface AuthService {

    void register(RegisterRequest request);
    void registerFaculty(RegisterRequest request);
    void registerStudent(RegisterRequest request);

    String login(LoginRequest request);
}
