package com.icr.backend.casestudy.controller;

import com.icr.backend.casestudy.dto.FacultySubmissionDTO;
import com.icr.backend.casestudy.entity.CaseSubmission;
import com.icr.backend.casestudy.entity.CaseStudy;
import com.icr.backend.casestudy.enums.SubmissionStatus;
import com.icr.backend.casestudy.repository.CaseSubmissionRepository;
import com.icr.backend.casestudy.repository.CaseStudyRepository;
import com.icr.backend.entity.User;
import com.icr.backend.repository.UserRepository;
import io.swagger.v3.oas.annotations.Operation;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/admin/submissions")
@RequiredArgsConstructor
public class AdminSubmissionController {

    private final CaseSubmissionRepository caseSubmissionRepository;
    private final CaseStudyRepository caseStudyRepository;
    private final UserRepository userRepository;

    @GetMapping("/reeval-pending")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Get pending re-evaluation requests")
    public List<FacultySubmissionDTO> getPendingReevaluationRequests() {
        List<CaseSubmission> submissions = caseSubmissionRepository.findByStatus(SubmissionStatus.REEVAL_REQUESTED);

        return submissions.stream()
                .map(submission -> {
                    String studentName = userRepository.findById(submission.getStudentId())
                            .map(User::getFullName)
                            .orElse("Unknown Student");

                    String caseTitle = caseStudyRepository.findById(submission.getCaseId())
                            .map(CaseStudy::getTitle)
                            .orElse("Unknown Case");

                    FacultySubmissionDTO dto = new FacultySubmissionDTO();
                    dto.setSubmissionId(submission.getId());
                    dto.setCaseId(submission.getCaseId());
                    dto.setStudentName(studentName);
                    dto.setCaseTitle(caseTitle);
                    dto.setReevalReason(submission.getReevalReason());
                    dto.setSubmittedAt(submission.getSubmittedAt());
                    dto.setStatus(submission.getStatus());
                    return dto;
                })
                .toList();
    }
}
