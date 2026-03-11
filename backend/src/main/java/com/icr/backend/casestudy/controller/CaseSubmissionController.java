package com.icr.backend.casestudy.controller;

import com.icr.backend.casestudy.dto.CaseSubmissionResponse;
import com.icr.backend.casestudy.dto.SubmissionEvaluationRequest;
import com.icr.backend.casestudy.dto.SubmissionRequest;
import com.icr.backend.casestudy.entity.SubmissionCoScore;
import com.icr.backend.casestudy.service.CaseSubmissionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/submissions")
@RequiredArgsConstructor
@Tag(name = "Submissions")
public class CaseSubmissionController {

    private final CaseSubmissionService caseSubmissionService;

    @PostMapping(consumes = MediaType.APPLICATION_JSON_VALUE)
    @PreAuthorize("hasRole('STUDENT')")
    @Operation(summary = "Student submits text or GitHub link solution")
    public CaseSubmissionResponse submitSolution(
            @RequestBody SubmissionRequest request) {

        return caseSubmissionService.submitSolution(request, null);
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('STUDENT')")
    @Operation(summary = "Student submits PDF solution")
    public CaseSubmissionResponse submitPdfSolution(
            @RequestParam Long caseId,
            @RequestParam(required = false) Integer selfRating,
            @RequestPart("file") MultipartFile file) {

        SubmissionRequest request = SubmissionRequest.builder()
                .caseId(caseId)
                .selfRating(selfRating)
                .build();

        return caseSubmissionService.submitSolution(request, file);
    }

    @PatchMapping("/{id}/evaluate")
    @PreAuthorize("hasRole('FACULTY')")
    @Operation(summary = "Faculty evaluates submission")
    public CaseSubmissionResponse evaluateSubmission(
            @PathVariable Long id,
            @RequestParam Integer marks,
            @RequestParam String comment) {

        return caseSubmissionService.evaluateSubmission(
                id,
                SubmissionEvaluationRequest.builder()
                        .score(marks)
                        .feedback(comment)
                        .build()
        );
    }

    @PutMapping("/{id}/evaluate")
    @PreAuthorize("hasRole('FACULTY')")
    @Operation(summary = "Faculty evaluates submission with request body")
    public CaseSubmissionResponse evaluateSubmissionWithBody(
            @PathVariable Long id,
            @RequestBody SubmissionEvaluationRequest request) {

        return caseSubmissionService.evaluateSubmission(id, request);
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

    @GetMapping("/{id}/co-scores")
    @PreAuthorize("hasAnyRole('FACULTY','STUDENT')")
    @Operation(summary = "Get course outcome score breakdown for a submission")
    public List<SubmissionCoScore> getCoScores(@PathVariable Long id) {
        return caseSubmissionService.getCoScores(id);
    }
}
