package com.icr.backend.casestudy.service;

import com.icr.backend.casestudy.dto.CaseSubmissionResponse;
import com.icr.backend.casestudy.dto.FacultyCaseSubmissionDTO;
import com.icr.backend.casestudy.dto.FacultySubmissionDTO;
import com.icr.backend.casestudy.dto.SubmissionEvaluationRequest;
import com.icr.backend.casestudy.dto.SubmissionRequest;
import com.icr.backend.casestudy.entity.CaseStudy;
import com.icr.backend.casestudy.entity.CaseSubmission;
import com.icr.backend.casestudy.entity.SubmissionCoScore;
import com.icr.backend.casestudy.enums.SubmissionStatus;
import com.icr.backend.casestudy.enums.SubmissionType;
import com.icr.backend.casestudy.repository.CaseStudyRepository;
import com.icr.backend.casestudy.repository.CaseSubmissionRepository;
import com.icr.backend.casestudy.repository.SubmissionCoScoreRepository;
import com.icr.backend.entity.User;
import com.icr.backend.enums.CaseStatus;
import com.icr.backend.exception.DuplicateSubmissionException;
import com.icr.backend.exception.ResourceNotFoundException;
import com.icr.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CaseSubmissionServiceImpl implements CaseSubmissionService {

    private final CaseSubmissionRepository caseSubmissionRepository;
    private final CaseStudyRepository caseStudyRepository;
    private final SubmissionCoScoreRepository submissionCoScoreRepository;
    private final UserRepository userRepository;

    @Override
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

        if (caseSubmissionRepository
                .findByCaseIdAndStudentId(caseStudy.getId(), student.getId())
                .isPresent()) {
            throw new DuplicateSubmissionException("You have already submitted this case");
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

        return mapToResponse(saved);
    }

    @Override
    public CaseSubmissionResponse evaluateSubmission(Long submissionId,
                                                     SubmissionEvaluationRequest request) {
        Integer marksAwarded = request != null ? request.getScore() : null;
        if (marksAwarded == null) {
            throw new IllegalArgumentException("Score is required");
        }

        User faculty = getAuthenticatedUser();
        List<Long> facultyCaseIds = caseStudyRepository.findByCreatedBy_Id(faculty.getId())
                .stream()
                .map(CaseStudy::getId)
                .toList();
        if (facultyCaseIds.isEmpty()) {
            throw new ResourceNotFoundException("Submission not found");
        }

        CaseSubmission submission = caseSubmissionRepository.findByIdAndCaseIdIn(submissionId, facultyCaseIds)
                .orElseThrow(() -> new ResourceNotFoundException("Submission not found"));

        submission.setMarksAwarded(marksAwarded);
        submission.setFacultyFeedback(request != null ? request.getFeedback() : null);
        submission.setStatus(SubmissionStatus.EVALUATED);
        submission.setEvaluatedAt(LocalDateTime.now());

        CaseSubmission savedSubmission = caseSubmissionRepository.save(submission);

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
    public List<CaseSubmissionResponse> getSubmissionsByCase(Long caseId) {

        caseStudyRepository.findById(caseId)
                .orElseThrow(() -> new ResourceNotFoundException("Case not found with id: " + caseId));

        return caseSubmissionRepository.findByCaseId(caseId)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    public List<CaseSubmissionResponse> getMySubmissions() {

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();

        if (auth == null || !auth.isAuthenticated()) {
            return List.of();
        }

        String email = auth.getName();

        if (email == null || email.isBlank() || "anonymousUser".equalsIgnoreCase(email)) {
            return List.of();
        }

        var studentOptional = userRepository.findByEmail(email);
        if (studentOptional.isEmpty() || studentOptional.get() == null || studentOptional.get().getId() == null) {
            return List.of();
        }

        List<CaseSubmission> submissions = caseSubmissionRepository.findByStudentId(studentOptional.get().getId());
        if (submissions == null) {
            return List.of();
        }

        return submissions
                .stream()
                .filter(Objects::nonNull)
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    public List<FacultyCaseSubmissionDTO> getFacultySubmissionsByCase(Long caseId) {
        User faculty = getAuthenticatedUser();
        return caseSubmissionRepository.findFacultySubmissionsByCaseId(caseId, faculty.getId());
    }

    @Override
    public FacultySubmissionDTO getFacultySubmission(Long submissionId) {
        User faculty = getAuthenticatedUser();

        List<CaseStudy> facultyCases = caseStudyRepository.findByCreatedBy_Id(faculty.getId());
        if (facultyCases.isEmpty()) {
            throw new ResourceNotFoundException("Submission not found");
        }

        List<Long> caseIds = facultyCases.stream().map(CaseStudy::getId).toList();
        Map<Long, String> caseTitles = facultyCases.stream()
                .collect(Collectors.toMap(CaseStudy::getId, CaseStudy::getTitle));

        CaseSubmission submission = caseSubmissionRepository.findByIdAndCaseIdIn(submissionId, caseIds)
                .orElseThrow(() -> new ResourceNotFoundException("Submission not found"));

        String studentName = userRepository.findById(submission.getStudentId())
                .map(User::getFullName)
                .orElse("Unknown Student");

        CaseStudy caseStudy = facultyCases.stream()
                .filter(item -> item.getId().equals(submission.getCaseId()))
                .findFirst()
                .orElse(null);

        return new FacultySubmissionDTO(
                submission.getId(),
                submission.getCaseId(),
                caseStudy != null && caseStudy.getCourse() != null ? caseStudy.getCourse().getId() : null,
                studentName,
                caseTitles.getOrDefault(submission.getCaseId(), "Unknown Case"),
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
