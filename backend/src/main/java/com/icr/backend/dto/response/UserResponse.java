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
    private String status;
    private String department;
    private String specialization;
    private Long requestedFacultyId;
    private String requestedFacultyName;
    private String requestedFacultyEmail;
    private String rejectionReason;
    private LocalDateTime createdAt;
}
