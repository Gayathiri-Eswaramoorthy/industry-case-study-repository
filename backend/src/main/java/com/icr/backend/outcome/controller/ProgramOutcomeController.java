package com.icr.backend.outcome.controller;

import com.icr.backend.outcome.dto.ProgramOutcomeRequest;
import com.icr.backend.outcome.dto.ProgramOutcomeResponse;
import com.icr.backend.outcome.service.ProgramOutcomeService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/program-outcomes")
@RequiredArgsConstructor
public class ProgramOutcomeController {

    private final ProgramOutcomeService programOutcomeService;

    // Only ADMIN can create PO
    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ProgramOutcomeResponse createProgramOutcome(
            @RequestBody ProgramOutcomeRequest request) {

        return programOutcomeService.createProgramOutcome(request);
    }

    // All roles can view PO
    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','FACULTY','STUDENT')")
    public List<ProgramOutcomeResponse> getAllProgramOutcomes() {
        return programOutcomeService.getAllProgramOutcomes();
    }
}