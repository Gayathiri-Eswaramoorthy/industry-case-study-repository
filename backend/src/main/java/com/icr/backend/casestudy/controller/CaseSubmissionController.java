package com.icr.backend.casestudy.controller;

import com.icr.backend.casestudy.dto.CaseSubmissionResponse;
import com.icr.backend.casestudy.dto.SubmissionEvaluationRequest;
import com.icr.backend.casestudy.dto.SubmissionRequest;
import com.icr.backend.casestudy.service.CaseSubmissionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/submissions")
@RequiredArgsConstructor
@Tag(name = "Submissions")
public class CaseSubmissionController {

    private final CaseSubmissionService caseSubmissionService;

    @PostMapping
    @PreAuthorize("hasRole('STUDENT')")
    @Operation(summary = "Student submits solution")
    public CaseSubmissionResponse submitSolution(
            @RequestBody SubmissionRequest request) {

        return caseSubmissionService.submitSolution(request);
    }

    @PatchMapping("/{id}/evaluate")
    @PreAuthorize("hasRole('FACULTY')")
    @Operation(summary = "Faculty evaluates submission")
    public CaseSubmissionResponse evaluateSubmission(
            @PathVariable Long id,
            @RequestParam Integer marks,
            @RequestParam String comment) {

        return caseSubmissionService.evaluateSubmission(id, marks, comment);
    }

    @PutMapping("/{id}/evaluate")
    @PreAuthorize("hasRole('FACULTY')")
    @Operation(summary = "Faculty evaluates submission with request body")
    public CaseSubmissionResponse evaluateSubmissionWithBody(
            @PathVariable Long id,
            @RequestBody SubmissionEvaluationRequest request) {

        return caseSubmissionService.evaluateSubmission(id, request.getScore(), request.getFeedback());
    }

    @GetMapping("/case/{caseId}")
    @PreAuthorize("hasRole('FACULTY')")
    @Operation(summary = "Faculty views submissions by case")
    public List<CaseSubmissionResponse> getSubmissionsForCase(
            @PathVariable Long caseId) {

        return caseSubmissionService.getSubmissionsByCase(caseId);
    }

    @GetMapping("/my")
    @PreAuthorize("hasRole('STUDENT')")
    @Operation(summary = "Get my submissions")
    public List<CaseSubmissionResponse> getMySubmissions() {

        return caseSubmissionService.getMySubmissions();
    }
}
