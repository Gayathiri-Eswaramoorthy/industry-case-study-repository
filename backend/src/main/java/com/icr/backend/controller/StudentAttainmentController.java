package com.icr.backend.controller;

import com.icr.backend.dto.StudentPoAttainmentDTO;
import com.icr.backend.dto.response.ApiResponse;
import com.icr.backend.dto.StudentCoAttainmentDTO;
import com.icr.backend.service.StudentAttainmentService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/students")
@RequiredArgsConstructor
public class StudentAttainmentController {

    private final StudentAttainmentService studentAttainmentService;

    @GetMapping("/{studentId}/co-attainment")
    @PreAuthorize("hasAnyRole('STUDENT', 'FACULTY', 'ADMIN')")
    public ApiResponse<List<StudentCoAttainmentDTO>> getCoAttainment(@PathVariable Long studentId) {
        return ApiResponse.<List<StudentCoAttainmentDTO>>builder()
                .success(true)
                .message("CO attainment fetched successfully")
                .data(studentAttainmentService.getCoAttainment(studentId))
                .timestamp(LocalDateTime.now())
                .build();
    }

    @GetMapping("/{studentId}/po-attainment")
    @PreAuthorize("hasAnyRole('STUDENT', 'FACULTY', 'ADMIN')")
    public ApiResponse<List<StudentPoAttainmentDTO>> getPoAttainment(@PathVariable Long studentId) {
        return ApiResponse.<List<StudentPoAttainmentDTO>>builder()
                .success(true)
                .message("PO attainment fetched successfully")
                .data(studentAttainmentService.getPoAttainment(studentId))
                .timestamp(LocalDateTime.now())
                .build();
    }
}
