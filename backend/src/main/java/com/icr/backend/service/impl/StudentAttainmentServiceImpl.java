package com.icr.backend.service.impl;

import com.icr.backend.casestudy.entity.CaseCoMapping;
import com.icr.backend.casestudy.entity.CaseSubmission;
import com.icr.backend.casestudy.enums.SubmissionStatus;
import com.icr.backend.casestudy.repository.CaseCoMappingRepository;
import com.icr.backend.casestudy.repository.CaseSubmissionRepository;
import com.icr.backend.dto.StudentCoAttainmentDTO;
import com.icr.backend.dto.StudentPoAttainmentDTO;
import com.icr.backend.entity.User;
import com.icr.backend.enums.RoleType;
import com.icr.backend.exception.ResourceNotFoundException;
import com.icr.backend.outcome.entity.ProgramOutcome;
import com.icr.backend.outcome.repository.ProgramOutcomeRepository;
import com.icr.backend.outcome.service.CoPoMappingService;
import com.icr.backend.repository.UserRepository;
import com.icr.backend.service.StudentAttainmentService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.util.Comparator;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class StudentAttainmentServiceImpl implements StudentAttainmentService {

    private static final int ATTAINED_THRESHOLD = 60;
    private static final int PARTIAL_THRESHOLD = 40;

    private final CaseSubmissionRepository caseSubmissionRepository;
    private final CaseCoMappingRepository caseCoMappingRepository;
    private final CoPoMappingService coPoMappingService;
    private final ProgramOutcomeRepository programOutcomeRepository;
    private final UserRepository userRepository;

    @Override
    public List<StudentCoAttainmentDTO> getCoAttainment(Long studentId) {
        validateStudentAccess(studentId);

        try {
            List<CaseSubmission> evaluatedSubmissions =
                    caseSubmissionRepository.findByStudentIdAndStatus(studentId, SubmissionStatus.EVALUATED);

            if (evaluatedSubmissions == null || evaluatedSubmissions.isEmpty()) {
                return Collections.emptyList();
            }

            Map<Long, CaseSubmission> submissionsByCaseId = evaluatedSubmissions.stream()
                    .filter(submission -> submission != null
                            && submission.getCaseId() != null
                            && submission.getMarksAwarded() != null)
                    .collect(Collectors.toMap(
                            CaseSubmission::getCaseId,
                            submission -> submission,
                            (existing, replacement) -> replacement
                    ));

            if (submissionsByCaseId.isEmpty()) {
                return Collections.emptyList();
            }

            List<Long> caseIds = List.copyOf(submissionsByCaseId.keySet());
            if (caseIds.isEmpty()) {
                return Collections.emptyList();
            }

            List<CaseCoMapping> mappings = caseCoMappingRepository.findByCaseStudyIdIn(caseIds);
            if (mappings == null || mappings.isEmpty()) {
                return Collections.emptyList();
            }

            return mappings.stream()
                    .filter(mapping -> mapping != null
                            && mapping.getCaseStudy() != null
                            && mapping.getCaseStudy().getId() != null
                            && mapping.getCourseOutcome() != null
                            && mapping.getCourseOutcome().getId() != null)
                    .map(mapping -> {
                        CaseSubmission submission = submissionsByCaseId.get(mapping.getCaseStudy().getId());
                        if (submission == null || submission.getMarksAwarded() == null) {
                            return null;
                        }

                        Integer score = submission.getMarksAwarded();
                        return new StudentCoAttainmentDTO(
                                mapping.getCourseOutcome().getId(),
                                mapping.getCourseOutcome().getCode(),
                                mapping.getCourseOutcome().getDescription(),
                                score,
                                resolveAttainmentStatus(score)
                        );
                    })
                    .filter(Objects::nonNull)
                    .sorted(Comparator
                            .comparing(StudentCoAttainmentDTO::getCourseOutcomeCode, Comparator.nullsLast(String::compareToIgnoreCase))
                            .thenComparing(StudentCoAttainmentDTO::getCourseOutcomeId, Comparator.nullsLast(Long::compareTo)))
                    .toList();
        } catch (Exception e) {
            log.error("Error calculating CO attainment for student {}: {}", studentId, e.getMessage(), e);
            return Collections.emptyList();
        }
    }

    @Override
    public List<StudentPoAttainmentDTO> getPoAttainment(Long studentId) {
        validateStudentAccess(studentId);

        List<CaseSubmission> evaluatedSubmissions =
                caseSubmissionRepository.findByStudentIdAndStatus(studentId, SubmissionStatus.EVALUATED);

        if (evaluatedSubmissions.isEmpty()) {
            return List.of();
        }

        Map<Long, List<Integer>> scoresByPoId = new HashMap<>();

        for (CaseSubmission submission : evaluatedSubmissions) {
            if (submission.getCaseId() == null || submission.getMarksAwarded() == null) {
                continue;
            }

            List<CaseCoMapping> coMappings = caseCoMappingRepository.findByCaseStudyId(submission.getCaseId());
            for (CaseCoMapping coMapping : coMappings) {
                Long courseOutcomeId = coMapping.getCourseOutcome() != null
                        ? coMapping.getCourseOutcome().getId()
                        : null;
                if (courseOutcomeId == null) {
                    continue;
                }

                for (Long poId : coPoMappingService.getPoIdsForCo(courseOutcomeId)) {
                    scoresByPoId.computeIfAbsent(poId, ignored -> new java.util.ArrayList<>())
                            .add(submission.getMarksAwarded());
                }
            }
        }

        if (scoresByPoId.isEmpty()) {
            return List.of();
        }

        Map<Long, ProgramOutcome> poLookup = programOutcomeRepository.findAllById(scoresByPoId.keySet()).stream()
                .collect(Collectors.toMap(ProgramOutcome::getId, po -> po));

        return scoresByPoId.entrySet().stream()
                .map(entry -> {
                    ProgramOutcome po = poLookup.get(entry.getKey());
                    if (po == null) {
                        return null;
                    }

                    double averageScore = entry.getValue().stream()
                            .mapToInt(Integer::intValue)
                            .average()
                            .orElse(0.0);
                    double roundedAverage = Math.round(averageScore * 100.0) / 100.0;

                    return new StudentPoAttainmentDTO(
                            po.getId(),
                            po.getCode(),
                            po.getDescription(),
                            roundedAverage,
                            resolveAttainmentStatus(roundedAverage)
                    );
                })
                .filter(Objects::nonNull)
                .sorted(Comparator
                        .comparing(StudentPoAttainmentDTO::getProgramOutcomeCode, Comparator.nullsLast(String::compareToIgnoreCase))
                        .thenComparing(StudentPoAttainmentDTO::getProgramOutcomeId, Comparator.nullsLast(Long::compareTo)))
                .toList();
    }

    private String resolveAttainmentStatus(Number score) {
        double safeScore = score != null ? score.doubleValue() : 0;
        if (safeScore >= ATTAINED_THRESHOLD) {
            return "ATTAINED";
        }
        if (safeScore >= PARTIAL_THRESHOLD) {
            return "PARTIAL";
        }
        return "NOT_ATTAINED";
    }

    private void validateStudentAccess(Long studentId) {
        User requestedStudent = userRepository.findById(studentId)
                .orElseThrow(() -> new ResourceNotFoundException("Student not found with id: " + studentId));

        if (requestedStudent.getRole() == null || requestedStudent.getRole().getName() != RoleType.STUDENT) {
            throw new ResourceNotFoundException("Student not found with id: " + studentId);
        }

        User authenticatedUser = getAuthenticatedUser();
        if (authenticatedUser.getRole() != null
                && authenticatedUser.getRole().getName() == RoleType.STUDENT
                && !Objects.equals(authenticatedUser.getId(), studentId)) {
            throw new AccessDeniedException("Students can only access their own attainment report");
        }
    }

    private User getAuthenticatedUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) {
            throw new AccessDeniedException("User not authenticated");
        }

        String email = auth.getName();
        if (email == null || email.isBlank() || "anonymousUser".equalsIgnoreCase(email)) {
            throw new AccessDeniedException("User not authenticated");
        }

        return userRepository.findByEmail(email)
                .orElseThrow(() -> new AccessDeniedException("Authenticated user not found"));
    }
}
