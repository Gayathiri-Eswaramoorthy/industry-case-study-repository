package com.icr.backend.casestudy.service;

import com.icr.backend.casestudy.dto.CaseSubmissionResponse;
import com.icr.backend.casestudy.dto.FacultyCaseSubmissionDTO;
import com.icr.backend.casestudy.dto.FacultySubmissionDTO;
import com.icr.backend.casestudy.dto.SubmissionEvaluationRequest;
import com.icr.backend.casestudy.dto.SubmissionRequest;
import com.icr.backend.casestudy.entity.CaseStudy;
import com.icr.backend.casestudy.entity.CaseSubmission;
import com.icr.backend.casestudy.entity.SubmissionGroupMember;
import com.icr.backend.casestudy.entity.SubmissionCoScore;
import com.icr.backend.casestudy.enums.ActivityEvent;
import com.icr.backend.casestudy.enums.MemberStatus;
import com.icr.backend.casestudy.enums.SubmissionStatus;
import com.icr.backend.casestudy.enums.SubmissionType;
import com.icr.backend.casestudy.repository.CaseStudyRepository;
import com.icr.backend.casestudy.repository.CaseSubmissionRepository;
import com.icr.backend.casestudy.repository.SubmissionGroupMemberRepository;
import com.icr.backend.casestudy.repository.SubmissionCoScoreRepository;
import com.icr.backend.entity.User;
import com.icr.backend.enums.CaseStatus;
import com.icr.backend.exception.DuplicateSubmissionException;
import com.icr.backend.exception.ResourceNotFoundException;
import com.icr.backend.repository.UserRepository;
import com.icr.backend.service.ActivityService;
import com.icr.backend.storage.StorageService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Objects;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class CaseSubmissionServiceImpl implements CaseSubmissionService {

    private final CaseSubmissionRepository caseSubmissionRepository;
    private final CaseStudyRepository caseStudyRepository;
    private final SubmissionCoScoreRepository submissionCoScoreRepository;
    private final SubmissionGroupMemberRepository submissionGroupMemberRepository;
    private final UserRepository userRepository;
    private final ActivityService activityService;
    private final StorageService storageService;

    @Override
    @Transactional
    public CaseSubmissionResponse submitSolution(SubmissionRequest request, MultipartFile pdfFile) {

        var auth = SecurityContextHolder.getContext().getAuthentication();

        if (auth == null || !auth.isAuthenticated()) {
            throw new RuntimeException("User not authenticated");
        }

        String email = auth.getName();

        var student = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Student not found"));

        CaseStudy caseStudy = caseStudyRepository.findById(request.getCaseId())
                .orElseThrow(() -> new RuntimeException("Case not found"));

        if (caseStudy.getStatus() == CaseStatus.ARCHIVED) {
            throw new ResponseStatusException(HttpStatus.GONE, "Case is archived");
        }
        if (caseStudy.getStatus() != CaseStatus.PUBLISHED) {
            throw new IllegalArgumentException("Submissions are allowed only for published case studies");
        }

        Optional<CaseSubmission> existingSubmission = caseSubmissionRepository
                .findByCaseIdAndStudentId(caseStudy.getId(), student.getId());

        if (existingSubmission.isPresent()) {
            throw new DuplicateSubmissionException("You have already submitted this case");
        }

        Long groupId = null;
        if (caseStudy.isGroupSubmissionEnabled()) {
            SubmissionGroupMember approvedMembership = submissionGroupMemberRepository
                    .findByStudentIdAndGroup_CaseStudyId(student.getId(), caseStudy.getId()).stream()
                    .filter(member -> member.getStatus() == MemberStatus.APPROVED)
                    .findFirst()
                    .orElse(null);

            if (approvedMembership == null || approvedMembership.getGroup() == null) {
                throw new IllegalStateException("You must be in an approved group to submit this case");
            }

            groupId = approvedMembership.getGroup().getId();
            if (groupId == null) {
                throw new IllegalStateException("You must be in an approved group to submit this case");
            }

            if (caseSubmissionRepository.existsByCaseIdAndGroupId(caseStudy.getId(), groupId)) {
                throw new DuplicateSubmissionException("This group has already submitted this case");
            }
        }

        SubmissionPayload payload = buildSubmissionPayload(caseStudy.getSubmissionType(), request, pdfFile);
        Long evaluatingFacultyId = student.getRequestedFaculty() != null
                ? student.getRequestedFaculty().getId()
                : (caseStudy.getCreatedBy() != null ? caseStudy.getCreatedBy().getId() : null);

        CaseSubmission submission = CaseSubmission.builder()
                .caseId(caseStudy.getId())
                .studentId(student.getId())
                .groupId(groupId)
                .evaluatingFacultyId(evaluatingFacultyId)
                .solutionText(payload.solutionText())
                .executiveSummary(request.getExecutiveSummary())
                .situationAnalysis(request.getSituationAnalysis())
                .rootCauseAnalysis(request.getRootCauseAnalysis())
                .proposedSolution(request.getProposedSolution())
                .implementationPlan(request.getImplementationPlan())
                .risksAndConstraints(request.getRisksAndConstraints())
                .conclusion(request.getConclusion())
                .githubLink(payload.githubLink())
                .pdfFileName(payload.pdfFileName())
                .pdfFilePath(payload.pdfFilePath())
                .selfRating(request.getSelfRating())
                .status(SubmissionStatus.SUBMITTED)
                .submittedAt(LocalDateTime.now())
                .build();

        CaseSubmission saved = caseSubmissionRepository.save(submission);

        logActivityForSubmissionContext(saved, ActivityEvent.SUBMITTED);
        logActivityForSubmissionContext(saved, ActivityEvent.UNDER_REVIEW);

        return mapToResponse(saved);
    }

    @Override
    @Transactional
    public CaseSubmissionResponse evaluateSubmission(Long submissionId,
                                                     SubmissionEvaluationRequest request) {
        Integer marksAwarded = request != null ? request.getScore() : null;
        if (marksAwarded == null) {
            throw new IllegalArgumentException("Score is required");
        }

        User faculty = getAuthenticatedUser();

        CaseSubmission submission = caseSubmissionRepository
                .findByIdAndStudentFacultyId(submissionId, faculty.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Submission not found"));

        submission.setMarksAwarded(marksAwarded);
        submission.setFacultyFeedback(request != null ? request.getFeedback() : null);
        submission.setStatus(SubmissionStatus.EVALUATED);
        submission.setEvaluatedAt(LocalDateTime.now());

        CaseSubmission savedSubmission = caseSubmissionRepository.save(submission);

        logActivityForSubmissionContext(savedSubmission, ActivityEvent.EVALUATED);

        if (request != null && request.getCoScores() != null && !request.getCoScores().isEmpty()) {
            submissionCoScoreRepository.deleteBySubmissionId(savedSubmission.getId());
            List<SubmissionCoScore> coScores = request.getCoScores().stream()
                    .map(coScore -> SubmissionCoScore.builder()
                            .submissionId(savedSubmission.getId())
                            .coId(coScore.getCoId())
                            .score(coScore.getScore())
                            .maxScore(coScore.getMaxScore())
                            .build())
                    .toList();
            submissionCoScoreRepository.saveAll(coScores);
        }

        return mapToResponse(savedSubmission);
    }

    @Override
    @Transactional(readOnly = true)
    public List<CaseSubmissionResponse> getSubmissionsByCase(Long caseId) {

        caseStudyRepository.findById(caseId)
                .orElseThrow(() -> new ResourceNotFoundException("Case not found with id: " + caseId));

        return caseSubmissionRepository.findByCaseId(caseId)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public Page<CaseSubmissionResponse> getMySubmissions(Pageable pageable) {

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();

        if (auth == null || !auth.isAuthenticated()) {
            return Page.empty(pageable);
        }

        String email = auth.getName();

        if (email == null || email.isBlank() || "anonymousUser".equalsIgnoreCase(email)) {
            return Page.empty(pageable);
        }

        var studentOptional = userRepository.findByEmail(email);
        if (studentOptional.isEmpty() || studentOptional.get() == null || studentOptional.get().getId() == null) {
            return Page.empty(pageable);
        }

        return caseSubmissionRepository.findVisibleSubmissionsForStudent(studentOptional.get().getId(), pageable)
                .map(this::mapToResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public List<FacultyCaseSubmissionDTO> getFacultySubmissionsByCase(Long caseId) {
        User faculty = getAuthenticatedUser();
        return caseSubmissionRepository.findFacultySubmissionsByCaseId(caseId, faculty.getId());
    }

    @Override
    @Transactional(readOnly = true)
    public FacultySubmissionDTO getFacultySubmission(Long submissionId) {
        User faculty = getAuthenticatedUser();

        CaseSubmission submission = caseSubmissionRepository
                .findByIdAndStudentFacultyId(submissionId, faculty.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Submission not found"));

        String studentName = userRepository.findById(submission.getStudentId())
                .map(User::getFullName)
                .orElse("Unknown Student");

        CaseStudy caseStudy = caseStudyRepository.findById(submission.getCaseId())
                .orElse(null);

        return new FacultySubmissionDTO(
                submission.getId(),
                submission.getCaseId(),
                caseStudy != null && caseStudy.getCourse() != null ? caseStudy.getCourse().getId() : null,
                studentName,
                caseStudy != null ? caseStudy.getTitle() : "Unknown Case",
                submission.getSolutionText(),
                submission.getExecutiveSummary(),
                submission.getSituationAnalysis(),
                submission.getRootCauseAnalysis(),
                submission.getProposedSolution(),
                submission.getImplementationPlan(),
                submission.getRisksAndConstraints(),
                submission.getConclusion(),
                submission.getGithubLink(),
                submission.getPdfFileName(),
                submission.getPdfFilePath(),
                submission.getSelfRating(),
                submission.getMarksAwarded(),
                submission.getFacultyFeedback(),
                submission.getSubmittedAt(),
                submission.getStatus()
        );
    }

    @Override
    @Transactional(readOnly = true)
    public List<SubmissionCoScore> getCoScores(Long submissionId) {
        return submissionCoScoreRepository.findBySubmissionId(submissionId);
    }

    private SubmissionPayload buildSubmissionPayload(
            SubmissionType submissionType,
            SubmissionRequest request,
            MultipartFile pdfFile
    ) {
        if (submissionType == SubmissionType.GITHUB_LINK) {
            if (!StringUtils.hasText(request.getGithubLink())) {
                throw new IllegalArgumentException("GitHub link is required for this case");
            }

            return new SubmissionPayload(
                    null,
                    request.getGithubLink().trim(),
                    null,
                    null
            );
        }

        if (submissionType == SubmissionType.PDF) {
            if (pdfFile == null || pdfFile.isEmpty()) {
                throw new IllegalArgumentException("PDF file is required for this case");
            }

            return storePdfSubmission(pdfFile);
        }

        if (!StringUtils.hasText(request.getSolutionText())) {
            throw new IllegalArgumentException("Solution text is required for this case");
        }

        return new SubmissionPayload(
                request.getSolutionText().trim(),
                null,
                null,
                null
        );
    }

    private SubmissionPayload storePdfSubmission(MultipartFile pdfFile) {
        String originalFileName = StringUtils.cleanPath(
                Objects.requireNonNullElse(pdfFile.getOriginalFilename(), "submission.pdf")
        );

        if (!originalFileName.toLowerCase().endsWith(".pdf")) {
            throw new IllegalArgumentException("Only PDF files are allowed");
        }

        try {
            String storedFileName = UUID.randomUUID() + "-" + originalFileName;
            String storedPath = storageService.store(
                    pdfFile.getInputStream(),
                    "uploads/submissions",
                    storedFileName,
                    pdfFile.getContentType()
            );

            return new SubmissionPayload(
                    null,
                    null,
                    originalFileName,
                    storedPath
            );
        } catch (IOException ex) {
            throw new RuntimeException("Failed to store PDF submission", ex);
        }
    }

    private CaseSubmissionResponse mapToResponse(CaseSubmission submission) {

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

    private User getAuthenticatedUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) {
            throw new RuntimeException("User not authenticated");
        }

        String email = auth.getName();
        if (email == null || email.isBlank() || "anonymousUser".equalsIgnoreCase(email)) {
            throw new RuntimeException("User not authenticated");
        }

        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    private void logActivityForSubmissionContext(CaseSubmission submission, ActivityEvent event) {
        if (submission == null || submission.getCaseId() == null) {
            return;
        }

        List<Long> studentIds = resolveSubmissionStudentIds(submission);
        for (Long studentId : studentIds) {
            activityService.logEvent(studentId, submission.getCaseId(), event);
        }
    }

    private List<Long> resolveSubmissionStudentIds(CaseSubmission submission) {
        if (submission == null) {
            return List.of();
        }

        if (submission.getGroupId() == null) {
            return submission.getStudentId() == null ? List.of() : List.of(submission.getStudentId());
        }

        List<Long> memberIds = submissionGroupMemberRepository.findByGroupId(submission.getGroupId()).stream()
                .filter(member -> member != null
                        && member.getStatus() == MemberStatus.APPROVED
                        && member.getStudent() != null
                        && member.getStudent().getId() != null)
                .map(member -> member.getStudent().getId())
                .distinct()
                .toList();

        if (!memberIds.isEmpty()) {
            return memberIds;
        }

        return submission.getStudentId() == null ? List.of() : List.of(submission.getStudentId());
    }

    private record SubmissionPayload(
            String solutionText,
            String githubLink,
            String pdfFileName,
            String pdfFilePath
    ) {
    }
}
