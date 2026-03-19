package com.icr.backend.casestudy.controller;

import com.icr.backend.casestudy.dto.FacultySubmissionDTO;
import com.icr.backend.casestudy.service.CaseSubmissionService;
import com.icr.backend.casestudy.service.FacultySubmissionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/faculty")
@RequiredArgsConstructor
@Tag(name = "Faculty Submissions")
public class FacultySubmissionController {

    private final FacultySubmissionService submissionService;
    private final CaseSubmissionService caseSubmissionService;

    @GetMapping("/submissions")
    @PreAuthorize("hasAnyRole('FACULTY', 'ADMIN')")
    @Operation(summary = "Get submission review queue for logged-in faculty")
    public ResponseEntity<List<FacultySubmissionDTO>> getFacultySubmissions() {
        return ResponseEntity.ok(submissionService.getFacultySubmissions());
    }

    @GetMapping("/submissions/{id}")
    @PreAuthorize("hasAnyRole('FACULTY', 'ADMIN')")
    @Operation(summary = "Get one submission for faculty review")
    public FacultySubmissionDTO getFacultySubmission(@PathVariable Long id) {
        return caseSubmissionService.getFacultySubmission(id);
    }
}
