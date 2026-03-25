package com.icr.backend.service.impl;

import com.icr.backend.casestudy.entity.CaseCoMapping;
import com.icr.backend.casestudy.entity.CaseStudy;
import com.icr.backend.casestudy.entity.CaseSubmission;
import com.icr.backend.casestudy.entity.SubmissionCoScore;
import com.icr.backend.casestudy.enums.SubmissionStatus;
import com.icr.backend.casestudy.repository.CaseCoMappingRepository;
import com.icr.backend.casestudy.repository.CaseStudyRepository;
import com.icr.backend.casestudy.repository.CaseSubmissionRepository;
import com.icr.backend.casestudy.repository.SubmissionCoScoreRepository;
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
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.Collections;
import java.util.Collection;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class StudentAttainmentServiceImpl implements StudentAttainmentService {

    private static final int ATTAINED_THRESHOLD = 60;
    private static final int PARTIAL_THRESHOLD = 40;

    private final CaseSubmissionRepository caseSubmissionRepository;
    private final CaseCoMappingRepository caseCoMappingRepository;
    private final SubmissionCoScoreRepository submissionCoScoreRepository;
    private final CaseStudyRepository caseStudyRepository;
    private final CoPoMappingService coPoMappingService;
    private final ProgramOutcomeRepository programOutcomeRepository;
    private final UserRepository userRepository;

    @Override
    @Transactional(readOnly = true)
    public List<StudentCoAttainmentDTO> getCoAttainment(Long studentId) {
        validateStudentAccess(studentId);

        try {
            List<CaseSubmission> evaluatedSubmissions =
                    caseSubmissionRepository.findByStudentIdAndStatusIn(
                            studentId,
                            List.of(
                                    SubmissionStatus.EVALUATED,
                                    SubmissionStatus.REEVAL_REQUESTED
                            )
                    );
            log.info("Found {} evaluated submissions for student {}", evaluatedSubmissions.size(), studentId);

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

            Map<Long, CaseStudy> caseStudyMap = caseStudyRepository.findAllById(caseIds).stream()
                    .filter(caseStudy -> caseStudy != null && caseStudy.getId() != null)
                    .collect(Collectors.toMap(
                            CaseStudy::getId,
                            caseStudy -> caseStudy,
                            (existing, replacement) -> existing
                    ));
            Map<Long, Integer> inferredMaxMarksByCaseId = buildInferredMaxMarks(caseIds, caseStudyMap);

            Map<Long, Map<Long, SubmissionCoScore>> coScoresBySubmission = new HashMap<>();
            for (CaseSubmission submission : evaluatedSubmissions) {
                if (submission == null || submission.getId() == null) {
                    continue;
                }

                List<SubmissionCoScore> scores = submissionCoScoreRepository.findBySubmissionId(submission.getId());
                Map<Long, SubmissionCoScore> coScoreMap = scores.stream()
                        .filter(score -> score != null && score.getCoId() != null)
                        .collect(Collectors.toMap(
                                SubmissionCoScore::getCoId,
                                score -> score,
                                (existing, replacement) -> replacement
                        ));
                coScoresBySubmission.put(submission.getId(), coScoreMap);
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

                        Map<Long, SubmissionCoScore> coScoreMap =
                                coScoresBySubmission.getOrDefault(submission.getId(), Map.of());
                        Long courseOutcomeId = mapping.getCourseOutcome().getId();
                        SubmissionCoScore coScore = coScoreMap.get(courseOutcomeId);

                        int displayScore;
                        String attainmentStatus;

                        if (coScore != null
                                && coScore.getScore() != null
                                && coScore.getMaxScore() != null
                                && coScore.getMaxScore() > 0) {
                            displayScore = coScore.getScore();
                            double percentage = (coScore.getScore() * 100.0) / coScore.getMaxScore();
                            attainmentStatus = resolveAttainmentStatus(percentage);
                        } else {
                            CaseStudy caseStudy = caseStudyMap.get(submission.getCaseId());
                            int maxMarks = resolveCaseMaxMarks(
                                    submission.getCaseId(),
                                    caseStudy,
                                    inferredMaxMarksByCaseId
                            );
                            double percentage = (submission.getMarksAwarded() * 100.0) / maxMarks;
                            displayScore = submission.getMarksAwarded();
                            attainmentStatus = resolveAttainmentStatus(percentage);
                        }

                        return new StudentCoAttainmentDTO(
                                courseOutcomeId,
                                mapping.getCourseOutcome().getCode(),
                                mapping.getCourseOutcome().getDescription(),
                                displayScore,
                                attainmentStatus
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
    @Transactional(readOnly = true)
    public List<StudentPoAttainmentDTO> getPoAttainment(Long studentId) {
        validateStudentAccess(studentId);

        List<CaseSubmission> evaluatedSubmissions =
                caseSubmissionRepository.findByStudentIdAndStatusIn(
                        studentId,
                        List.of(
                                SubmissionStatus.EVALUATED,
                                SubmissionStatus.REEVAL_REQUESTED
                        )
                );

        if (evaluatedSubmissions.isEmpty()) {
            return List.of();
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
            return List.of();
        }

        Set<Long> caseIds = submissionsByCaseId.keySet();
        Map<Long, CaseStudy> caseStudyMap = caseStudyRepository.findAllById(caseIds).stream()
                .filter(caseStudy -> caseStudy != null && caseStudy.getId() != null)
                .collect(Collectors.toMap(
                        CaseStudy::getId,
                        caseStudy -> caseStudy,
                        (existing, replacement) -> existing
                ));
        Map<Long, Integer> inferredMaxMarksByCaseId = buildInferredMaxMarks(caseIds, caseStudyMap);

        Map<Long, Map<Long, SubmissionCoScore>> coScoresBySubmission = new HashMap<>();
        for (CaseSubmission submission : evaluatedSubmissions) {
            if (submission == null || submission.getId() == null) {
                continue;
            }

            List<SubmissionCoScore> scores = submissionCoScoreRepository.findBySubmissionId(submission.getId());
            Map<Long, SubmissionCoScore> coScoreMap = scores.stream()
                    .filter(score -> score != null && score.getCoId() != null)
                    .collect(Collectors.toMap(
                            SubmissionCoScore::getCoId,
                            score -> score,
                            (existing, replacement) -> replacement
                    ));
            coScoresBySubmission.put(submission.getId(), coScoreMap);
        }

        Map<Long, List<Double>> scoresByPoId = new HashMap<>();

        for (CaseSubmission submission : evaluatedSubmissions) {
            if (submission.getCaseId() == null || submission.getMarksAwarded() == null) {
                continue;
            }

            Map<Long, SubmissionCoScore> coScoreMap =
                    coScoresBySubmission.getOrDefault(submission.getId(), Map.of());
            CaseStudy caseStudy = caseStudyMap.get(submission.getCaseId());
            int maxMarks = resolveCaseMaxMarks(
                    submission.getCaseId(),
                    caseStudy,
                    inferredMaxMarksByCaseId
            );

            List<CaseCoMapping> coMappings = caseCoMappingRepository.findByCaseStudyId(submission.getCaseId());
            for (CaseCoMapping coMapping : coMappings) {
                Long courseOutcomeId = coMapping.getCourseOutcome() != null
                        ? coMapping.getCourseOutcome().getId()
                        : null;
                if (courseOutcomeId == null) {
                    continue;
                }

                SubmissionCoScore coScore = coScoreMap.get(courseOutcomeId);
                double percentage;
                if (coScore != null
                        && coScore.getScore() != null
                        && coScore.getMaxScore() != null
                        && coScore.getMaxScore() > 0) {
                    percentage = (coScore.getScore() * 100.0) / coScore.getMaxScore();
                } else {
                    percentage = (submission.getMarksAwarded() * 100.0) / maxMarks;
                }

                for (Long poId : coPoMappingService.getPoIdsForCo(courseOutcomeId)) {
                    scoresByPoId.computeIfAbsent(poId, ignored -> new java.util.ArrayList<>())
                            .add(percentage);
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
                            .mapToDouble(Double::doubleValue)
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

    private Map<Long, Integer> buildInferredMaxMarks(Collection<Long> caseIds, Map<Long, CaseStudy> caseStudyMap) {
        Map<Long, Integer> inferred = new HashMap<>();
        for (Long caseId : caseIds) {
            CaseStudy caseStudy = caseStudyMap.get(caseId);
            if (caseStudy != null && caseStudy.getMaxMarks() != null && caseStudy.getMaxMarks() > 0) {
                continue;
            }
            Integer inferredMax = caseSubmissionRepository.findMaxMarksAwardedByCaseId(caseId);
            if (inferredMax != null && inferredMax > 0) {
                inferred.put(caseId, inferredMax);
            }
        }
        return inferred;
    }

    private int resolveCaseMaxMarks(Long caseId, CaseStudy caseStudy, Map<Long, Integer> inferredMaxMarksByCaseId) {
        if (caseStudy != null && caseStudy.getMaxMarks() != null && caseStudy.getMaxMarks() > 0) {
            return caseStudy.getMaxMarks();
        }
        Integer inferredMax = inferredMaxMarksByCaseId.get(caseId);
        if (inferredMax != null && inferredMax > 0) {
            return inferredMax;
        }
        return 100;
    }
}
