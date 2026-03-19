package com.icr.backend.casestudy.service;

import com.icr.backend.casestudy.dto.CaseSubmissionResponse;
import com.icr.backend.casestudy.dto.FacultyCaseSubmissionDTO;
import com.icr.backend.casestudy.dto.FacultySubmissionDTO;
import com.icr.backend.casestudy.dto.SubmissionEvaluationRequest;
import com.icr.backend.casestudy.dto.SubmissionRequest;
import com.icr.backend.casestudy.entity.CaseStudy;
import com.icr.backend.casestudy.entity.CaseSubmission;
import com.icr.backend.casestudy.entity.SubmissionCoScore;
import com.icr.backend.casestudy.enums.ActivityEvent;
import com.icr.backend.casestudy.enums.SubmissionStatus;
import com.icr.backend.casestudy.enums.SubmissionType;
import com.icr.backend.casestudy.repository.CaseAssignmentRepository;
import com.icr.backend.casestudy.repository.CaseStudyRepository;
import com.icr.backend.casestudy.repository.CaseSubmissionRepository;
import com.icr.backend.casestudy.repository.SubmissionCoScoreRepository;
import com.icr.backend.entity.User;
import com.icr.backend.enums.CaseStatus;
import com.icr.backend.enums.RoleType;
import com.icr.backend.exception.DuplicateSubmissionException;
import com.icr.backend.exception.ResourceNotFoundException;
import com.icr.backend.repository.UserRepository;
import com.icr.backend.service.ActivityService;
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

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Objects;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@Service
@RequiredArgsConstructor
@Slf4j
public class CaseSubmissionServiceImpl implements CaseSubmissionService {

    private final CaseSubmissionRepository caseSubmissionRepository;
    private final CaseStudyRepository caseStudyRepository;
    private final SubmissionCoScoreRepository submissionCoScoreRepository;
    private final UserRepository userRepository;
    private final ActivityService activityService;
    private final CaseAssignmentRepository caseAssignmentRepository;

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

        if (caseStudy.getStatus() != CaseStatus.PUBLISHED) {
            throw new IllegalArgumentException("Submissions are allowed only for published case studies");
        }

        Optional<CaseSubmission> existingSubmission = caseSubmissionRepository
                .findByCaseIdAndStudentId(caseStudy.getId(), student.getId());

        if (existingSubmission.isPresent()) {
            CaseSubmission existing = existingSubmission.get();

            if (existing.getStatus() == SubmissionStatus.EVALUATED) {
                throw new DuplicateSubmissionException(
                        "Your submission has already been evaluated and cannot be changed."
                );
            }

            SubmissionPayload payload = buildSubmissionPayload(
                    caseStudy.getSubmissionType(), request, pdfFile
            );

            existing.setSolutionText(payload.solutionText());
            existing.setExecutiveSummary(request.getExecutiveSummary());
            existing.setSituationAnalysis(request.getSituationAnalysis());
            existing.setRootCauseAnalysis(request.getRootCauseAnalysis());
            existing.setProposedSolution(request.getProposedSolution());
            existing.setImplementationPlan(request.getImplementationPlan());
            existing.setRisksAndConstraints(request.getRisksAndConstraints());
            existing.setConclusion(request.getConclusion());
            existing.setGithubLink(payload.githubLink());
            existing.setPdfFileName(payload.pdfFileName());
            existing.setPdfFilePath(payload.pdfFilePath());
            existing.setSelfRating(request.getSelfRating());
            existing.setStatus(SubmissionStatus.SUBMITTED);
            existing.setSubmittedAt(LocalDateTime.now());
            existing.setMarksAwarded(null);
            existing.setFacultyFeedback(null);
            existing.setEvaluatedAt(null);

            CaseSubmission updated = caseSubmissionRepository.save(existing);
            activityService.logEvent(student.getId(), caseStudy.getId(), ActivityEvent.SUBMITTED);
            return mapToResponse(updated);
        }

        SubmissionPayload payload = buildSubmissionPayload(caseStudy.getSubmissionType(), request, pdfFile);

        CaseSubmission submission = CaseSubmission.builder()
                .caseId(caseStudy.getId())
                .studentId(student.getId())
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

        activityService.logEvent(student.getId(), caseStudy.getId(), ActivityEvent.SUBMITTED);
        activityService.logEvent(student.getId(), caseStudy.getId(), ActivityEvent.UNDER_REVIEW);

        return mapToResponse(saved);
    }

    @Override
    @Transactional
    public CaseSubmissionResponse evaluateSubmission(Long submissionId,
                                                     SubmissionEvaluationRequest request) {
        try {
            Integer marksAwarded = request != null ? request.getScore() : null;
            if (marksAwarded == null) {
                throw new IllegalArgumentException("Score is required");
            }

            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            User faculty = getAuthenticatedUser();
            CaseSubmission submission = caseSubmissionRepository.findById(submissionId)
                    .orElseThrow(() -> new ResourceNotFoundException(
                            "Submission not found: " + submissionId));

            boolean isAdmin = authentication != null && authentication.getAuthorities().stream()
                    .anyMatch(authority -> authority.getAuthority().equals("ROLE_ADMIN"));

            if (isAdmin) {
                if (submission.getStatus() != SubmissionStatus.REEVAL_REQUESTED) {
                    throw new IllegalStateException("Admin can only evaluate re-evaluation requests");
                }
            } else {
                List<Long> createdCaseIds = caseStudyRepository.findByCreatedBy_Id(faculty.getId())
                        .stream()
                        .map(CaseStudy::getId)
                        .toList();

                List<Long> assignedCaseIds = caseAssignmentRepository.findByFacultyId(faculty.getId())
                        .stream()
                        .map(assignment -> assignment.getCaseStudy().getId())
                        .toList();

                List<Long> allowedCaseIds = Stream.concat(createdCaseIds.stream(), assignedCaseIds.stream())
                        .distinct()
                        .toList();

                log.info("Faculty {} can evaluate cases: {}", faculty.getEmail(), allowedCaseIds);

                if (allowedCaseIds.isEmpty()) {
                    throw new ResourceNotFoundException("Submission not found");
                }

                submission = caseSubmissionRepository
                        .findByIdAndCaseIdIn(submissionId, allowedCaseIds)
                        .orElseThrow(() -> new ResourceNotFoundException("Submission not found"));

                if (submission.getStatus() == SubmissionStatus.EVALUATED) {
                    throw new IllegalStateException("This submission has already been evaluated");
                }
            }

            submission.setMarksAwarded(marksAwarded);
            submission.setFacultyFeedback(
                    request != null && request.getFeedback() != null ? request.getFeedback() : null
            );
            submission.setStatus(SubmissionStatus.EVALUATED);
            submission.setEvaluatedAt(LocalDateTime.now());

            CaseSubmission saved = caseSubmissionRepository.save(submission);
            log.info("Submission {} evaluated with score {}", submissionId, marksAwarded);

            activityService.logEvent(
                    submission.getStudentId(),
                    submission.getCaseId(),
                    ActivityEvent.EVALUATED
            );

            if (request != null && request.getCoScores() != null && !request.getCoScores().isEmpty()) {
                submissionCoScoreRepository.deleteBySubmissionId(saved.getId());

                List<SubmissionCoScore> coScores = request.getCoScores()
                        .stream()
                        .filter(coScore -> coScore.getCoId() != null &&
                                coScore.getScore() != null &&
                                coScore.getMaxScore() != null)
                        .map(coScore -> SubmissionCoScore.builder()
                                .submissionId(saved.getId())
                                .coId(coScore.getCoId())
                                .score(coScore.getScore())
                                .maxScore(coScore.getMaxScore())
                                .build())
                        .toList();

                submissionCoScoreRepository.saveAll(coScores);
                log.info("Saved {} CO scores for submission {}", coScores.size(), submissionId);
            }

            return mapToResponse(saved);
        } catch (IllegalArgumentException | IllegalStateException ex) {
            log.warn("Evaluation rejected for submission {}: {}", submissionId, ex.getMessage());
            throw ex;
        } catch (Exception ex) {
            log.error("Unexpected error evaluating submission {}", submissionId, ex);
            throw new RuntimeException("Failed to evaluate submission: " + ex.getMessage(), ex);
        }
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

        return caseSubmissionRepository.findByStudentId(studentOptional.get().getId(), pageable)
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
        User currentUser = getAuthenticatedUser();
        boolean isAdmin = currentUser.getRole() != null &&
                currentUser.getRole().getName() == RoleType.ADMIN;

        CaseSubmission submission = caseSubmissionRepository.findById(submissionId)
                .orElseThrow(() -> new ResourceNotFoundException("Submission not found"));

        String studentName = userRepository.findById(submission.getStudentId())
                .map(User::getFullName)
                .orElse("Unknown Student");

        CaseStudy caseStudy = caseStudyRepository
                .findByIdWithDetails(submission.getCaseId())
                .orElse(null);

        boolean canEvaluate = isAdmin || (
                caseStudy != null &&
                caseStudy.getCreatedBy() != null &&
                caseStudy.getCreatedBy().getId().equals(currentUser.getId())
        );

        FacultySubmissionDTO dto = new FacultySubmissionDTO();
        dto.setSubmissionId(submission.getId());
        dto.setCaseId(submission.getCaseId());
        dto.setCourseId(caseStudy != null && caseStudy.getCourse() != null
                ? caseStudy.getCourse().getId() : null);
        dto.setStudentName(studentName);
        dto.setCaseTitle(caseStudy != null ? caseStudy.getTitle() : "Unknown Case");
        dto.setCreatedByName(caseStudy != null && caseStudy.getCreatedBy() != null
                ? caseStudy.getCreatedBy().getFullName() : null);
        dto.setSolutionText(submission.getSolutionText());
        dto.setExecutiveSummary(submission.getExecutiveSummary());
        dto.setSituationAnalysis(submission.getSituationAnalysis());
        dto.setRootCauseAnalysis(submission.getRootCauseAnalysis());
        dto.setProposedSolution(submission.getProposedSolution());
        dto.setImplementationPlan(submission.getImplementationPlan());
        dto.setRisksAndConstraints(submission.getRisksAndConstraints());
        dto.setConclusion(submission.getConclusion());
        dto.setGithubLink(submission.getGithubLink());
        dto.setPdfFileName(submission.getPdfFileName());
        dto.setPdfFilePath(submission.getPdfFilePath());
        dto.setSelfRating(submission.getSelfRating());
        dto.setMarksAwarded(submission.getMarksAwarded());
        dto.setFacultyFeedback(submission.getFacultyFeedback());
        dto.setSubmittedAt(submission.getSubmittedAt());
        dto.setStatus(submission.getStatus());
        dto.setCanEvaluate(canEvaluate);
        return dto;
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
            Path uploadDirectory = Paths.get("uploads", "submissions");
            Files.createDirectories(uploadDirectory);

            String storedFileName = UUID.randomUUID() + "-" + originalFileName;
            Path destination = uploadDirectory.resolve(storedFileName);
            Files.copy(pdfFile.getInputStream(), destination, StandardCopyOption.REPLACE_EXISTING);

            return new SubmissionPayload(
                    null,
                    null,
                    originalFileName,
                    destination.toString()
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

    private record SubmissionPayload(
            String solutionText,
            String githubLink,
            String pdfFileName,
            String pdfFilePath
    ) {
    }
}
