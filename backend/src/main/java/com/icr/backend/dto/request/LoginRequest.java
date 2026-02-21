package com.icr.backend.dto.request;

import lombok.Data;

@Data
public class LoginRequest {

    private String email;
    private String password;
}
