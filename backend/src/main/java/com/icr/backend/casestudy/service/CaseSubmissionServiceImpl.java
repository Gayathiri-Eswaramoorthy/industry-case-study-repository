package com.icr.backend.casestudy.service;

import com.icr.backend.casestudy.dto.CaseSubmissionResponse;
import com.icr.backend.casestudy.dto.FacultyCaseSubmissionDTO;
import com.icr.backend.casestudy.dto.FacultySubmissionDTO;
import com.icr.backend.casestudy.dto.SubmissionRequest;
import com.icr.backend.casestudy.entity.CaseStudy;
import com.icr.backend.casestudy.entity.CaseSubmission;
import com.icr.backend.casestudy.enums.SubmissionStatus;
import com.icr.backend.casestudy.repository.CaseStudyRepository;
import com.icr.backend.casestudy.repository.CaseSubmissionRepository;
import com.icr.backend.entity.User;
import com.icr.backend.enums.CaseStatus;
import com.icr.backend.exception.DuplicateSubmissionException;
import com.icr.backend.exception.ResourceNotFoundException;
import com.icr.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CaseSubmissionServiceImpl implements CaseSubmissionService {

    private final CaseSubmissionRepository caseSubmissionRepository;
    private final CaseStudyRepository caseStudyRepository;
    private final UserRepository userRepository;

    @Override
    public CaseSubmissionResponse submitSolution(SubmissionRequest request) {

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

        CaseSubmission submission = CaseSubmission.builder()
                .caseId(caseStudy.getId())
                .studentId(student.getId())
                .solutionText(request.getSolutionText())
                .status(SubmissionStatus.SUBMITTED)
                .submittedAt(LocalDateTime.now())
                .build();

        CaseSubmission saved = caseSubmissionRepository.save(submission);

        return mapToResponse(saved);
    }

    @Override
    public CaseSubmissionResponse evaluateSubmission(Long submissionId,
                                                     Integer marksAwarded,
                                                     String facultyFeedback) {
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
        submission.setFacultyFeedback(facultyFeedback);
        submission.setStatus(SubmissionStatus.EVALUATED);
        submission.setEvaluatedAt(LocalDateTime.now());

        return mapToResponse(caseSubmissionRepository.save(submission));
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

        return new FacultySubmissionDTO(
                submission.getId(),
                studentName,
                caseTitles.getOrDefault(submission.getCaseId(), "Unknown Case"),
                submission.getSubmittedAt(),
                submission.getStatus()
        );
    }

    private CaseSubmissionResponse mapToResponse(CaseSubmission submission) {

        return CaseSubmissionResponse.builder()
                .id(submission.getId())
                .caseId(submission.getCaseId())
                .studentId(submission.getStudentId())
                .solutionText(submission.getSolutionText())
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
}
