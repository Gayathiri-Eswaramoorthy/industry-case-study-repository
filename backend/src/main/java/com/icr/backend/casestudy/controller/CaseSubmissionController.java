package com.icr.backend.casestudy.controller;

import com.icr.backend.casestudy.dto.CaseSubmissionResponse;
import com.icr.backend.casestudy.dto.ReEvaluationRequest;
import com.icr.backend.casestudy.dto.SubmissionEvaluationRequest;
import com.icr.backend.casestudy.dto.SubmissionRequest;
import com.icr.backend.casestudy.entity.CaseSubmission;
import com.icr.backend.casestudy.entity.SubmissionCoScore;
import com.icr.backend.casestudy.enums.SubmissionStatus;
import com.icr.backend.casestudy.repository.CaseSubmissionRepository;
import com.icr.backend.casestudy.service.CaseSubmissionService;
import com.icr.backend.dto.response.ApiResponse;
import com.icr.backend.dto.response.PageResponse;
import com.icr.backend.entity.User;
import com.icr.backend.exception.ResourceNotFoundException;
import com.icr.backend.repository.UserRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.MediaType;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.time.LocalDateTime;

@RestController
@RequestMapping("/api/submissions")
@RequiredArgsConstructor
@Tag(name = "Submissions")
public class CaseSubmissionController {

    private final CaseSubmissionService caseSubmissionService;
    private final CaseSubmissionRepository caseSubmissionRepository;
    private final UserRepository userRepository;

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
    @PreAuthorize("hasAnyRole('FACULTY', 'ADMIN')")
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
    @PreAuthorize("hasAnyRole('FACULTY', 'ADMIN')")
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
    public ApiResponse<PageResponse<CaseSubmissionResponse>> getMySubmissions(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        Page<CaseSubmissionResponse> submissions = caseSubmissionService.getMySubmissions(
                PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "submittedAt"))
        );

        return ApiResponse.<PageResponse<CaseSubmissionResponse>>builder()
                .success(true)
                .message("Submissions fetched successfully")
                .data(PageResponse.<CaseSubmissionResponse>builder()
                        .content(submissions.getContent())
                        .page(submissions.getNumber())
                        .size(submissions.getSize())
                        .totalElements(submissions.getTotalElements())
                        .totalPages(submissions.getTotalPages())
                        .last(submissions.isLast())
                        .build())
                .timestamp(LocalDateTime.now())
                .build();
    }

    @GetMapping("/{id}/co-scores")
    @PreAuthorize("hasAnyRole('FACULTY','STUDENT')")
    @Operation(summary = "Get course outcome score breakdown for a submission")
    public List<SubmissionCoScore> getCoScores(@PathVariable Long id) {
        return caseSubmissionService.getCoScores(id);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('FACULTY','STUDENT','ADMIN')")
    @Operation(summary = "Get submission by id")
    public CaseSubmissionResponse getSubmissionById(@PathVariable Long id) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) {
            throw new ResourceNotFoundException("Submission not found");
        }

        User currentUser = userRepository.findByEmail(auth.getName())
                .orElseThrow(() -> new ResourceNotFoundException("Submission not found"));
        CaseSubmission submission = caseSubmissionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Submission not found"));

        boolean isAdmin = currentUser.getRole() != null && currentUser.getRole().getName() == com.icr.backend.enums.RoleType.ADMIN;
        boolean isStudentOwner = currentUser.getRole() != null
                && currentUser.getRole().getName() == com.icr.backend.enums.RoleType.STUDENT
                && submission.getStudentId() != null
                && submission.getStudentId().equals(currentUser.getId());
        boolean isEvaluator = currentUser.getRole() != null
                && currentUser.getRole().getName() == com.icr.backend.enums.RoleType.FACULTY
                && submission.getEvaluatingFacultyId() != null
                && submission.getEvaluatingFacultyId().equals(currentUser.getId());

        if (!isAdmin && !isStudentOwner && !isEvaluator) {
            throw new ResourceNotFoundException("Submission not found");
        }

        return CaseSubmissionResponse.builder()
                .id(submission.getId())
                .caseId(submission.getCaseId())
                .studentId(submission.getStudentId())
                .solutionText(submission.getSolutionText())
                .executiveSummary(submission.getExecutiveSummary())
                .situationAnalysis(submission.getSituationAnalysis())
                .rootCauseAnalysis(submission.getRootCauseAnalysis())
                .proposedSolution(submission.getProposedSolution())
                .implementationPlan(submission.getImplementationPlan())
                .risksAndConstraints(submission.getRisksAndConstraints())
                .conclusion(submission.getConclusion())
                .githubLink(submission.getGithubLink())
                .pdfFileName(submission.getPdfFileName())
                .pdfFilePath(submission.getPdfFilePath())
                .selfRating(submission.getSelfRating())
                .marksAwarded(submission.getMarksAwarded())
                .facultyFeedback(submission.getFacultyFeedback())
                .status(submission.getStatus())
                .submittedAt(submission.getSubmittedAt())
                .evaluatedAt(submission.getEvaluatedAt())
                .build();
    }

    @PostMapping("/{id}/request-reeval")
    @PreAuthorize("hasRole('STUDENT')")
    @Transactional
    @Operation(summary = "Student requests re-evaluation")
    public CaseSubmissionResponse requestReevaluation(
            @PathVariable Long id,
            @Valid @RequestBody ReEvaluationRequest request
    ) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) {
            throw new RuntimeException("User not authenticated");
        }

        User student = userRepository.findByEmail(auth.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));

        CaseSubmission submission = caseSubmissionRepository.findById(id)
                .filter(item -> item.getStudentId().equals(student.getId()))
                .orElseThrow(() -> new ResourceNotFoundException("Submission not found"));

        if (submission.getStatus() != SubmissionStatus.EVALUATED) {
            throw new IllegalStateException("Can only request re-evaluation after evaluation");
        }

        submission.setStatus(SubmissionStatus.REEVAL_REQUESTED);
        submission.setReevalReason(request.getReason());

        CaseSubmission saved = caseSubmissionRepository.save(submission);

        return CaseSubmissionResponse.builder()
                .id(saved.getId())
                .caseId(saved.getCaseId())
                .studentId(saved.getStudentId())
                .solutionText(saved.getSolutionText())
                .executiveSummary(saved.getExecutiveSummary())
                .situationAnalysis(saved.getSituationAnalysis())
                .rootCauseAnalysis(saved.getRootCauseAnalysis())
                .proposedSolution(saved.getProposedSolution())
                .implementationPlan(saved.getImplementationPlan())
                .risksAndConstraints(saved.getRisksAndConstraints())
                .conclusion(saved.getConclusion())
                .githubLink(saved.getGithubLink())
                .pdfFileName(saved.getPdfFileName())
                .pdfFilePath(saved.getPdfFilePath())
                .selfRating(saved.getSelfRating())
                .marksAwarded(saved.getMarksAwarded())
                .facultyFeedback(saved.getFacultyFeedback())
                .status(saved.getStatus())
                .submittedAt(saved.getSubmittedAt())
                .evaluatedAt(saved.getEvaluatedAt())
                .build();
    }
}
