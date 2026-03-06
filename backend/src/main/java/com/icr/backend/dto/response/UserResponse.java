package com.icr.backend.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class UserResponse {

    private Long id;
    private String fullName;
    private String email;
    private String role;
    private LocalDateTime createdAt;
}
