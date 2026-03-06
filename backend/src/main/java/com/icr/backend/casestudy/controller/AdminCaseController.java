package com.icr.backend.casestudy.controller;

import com.icr.backend.casestudy.dto.CaseStudyResponse;
import com.icr.backend.casestudy.service.CaseStudyService;
import io.swagger.v3.oas.annotations.Operation;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/cases")
@RequiredArgsConstructor
public class AdminCaseController {

    private final CaseStudyService caseStudyService;

    @PutMapping("/{id}/publish")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Publish case")
    public CaseStudyResponse publishCase(@PathVariable Long id) {
        return caseStudyService.publishCase(id);
    }
}
