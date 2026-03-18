package com.icr.backend.outcome.controller;

import com.icr.backend.dto.response.ApiResponse;
import com.icr.backend.outcome.dto.ProgramOutcomeRequest;
import com.icr.backend.outcome.dto.ProgramOutcomeResponse;
import com.icr.backend.outcome.service.ProgramOutcomeService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/program-outcomes")
@RequiredArgsConstructor
public class ProgramOutcomeController {

    private final ProgramOutcomeService programOutcomeService;

    // Only ADMIN can create PO
    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<ProgramOutcomeResponse> createProgramOutcome(@RequestBody ProgramOutcomeRequest request) {
        return ApiResponse.<ProgramOutcomeResponse>builder()
                .success(true)
                .message("Program outcome created successfully")
                .data(programOutcomeService.createProgramOutcome(request))
                .timestamp(LocalDateTime.now())
                .build();
    }

    // All roles can view PO
    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','FACULTY','STUDENT')")
    public ApiResponse<List<ProgramOutcomeResponse>> getAllProgramOutcomes() {
        return ApiResponse.<List<ProgramOutcomeResponse>>builder()
                .success(true)
                .message("Program outcomes fetched successfully")
                .data(programOutcomeService.getAllProgramOutcomes())
                .timestamp(LocalDateTime.now())
                .build();
    }
}
