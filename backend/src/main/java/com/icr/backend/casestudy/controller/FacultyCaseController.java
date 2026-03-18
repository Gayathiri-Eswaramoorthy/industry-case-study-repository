package com.icr.backend.casestudy.controller;

import com.icr.backend.casestudy.dto.FacultyCaseSubmissionDTO;
import com.icr.backend.casestudy.dto.CaseStudyResponse;
import com.icr.backend.casestudy.dto.UpdateCaseStudyRequest;
import com.icr.backend.casestudy.service.CaseSubmissionService;
import com.icr.backend.casestudy.service.CaseStudyService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/faculty/cases")
@RequiredArgsConstructor
public class FacultyCaseController {

    private final CaseStudyService caseStudyService;
    private final CaseSubmissionService caseSubmissionService;

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('FACULTY', 'ADMIN')")
    public ResponseEntity<CaseStudyResponse> updateCase(
            @PathVariable Long id,
            @Valid @RequestBody UpdateCaseStudyRequest request) {

        return ResponseEntity.ok(caseStudyService.updateCase(id, request));
    }

    @GetMapping("/{id}/submissions")
    @PreAuthorize("hasRole('FACULTY')")
    public ResponseEntity<List<FacultyCaseSubmissionDTO>> getCaseSubmissions(
            @PathVariable Long id) {

        return ResponseEntity.ok(caseSubmissionService.getFacultySubmissionsByCase(id));
    }
}
