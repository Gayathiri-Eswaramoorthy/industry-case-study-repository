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
import com.icr.backend.dto.AdminCoAttainmentSummaryResponse;
import com.icr.backend.dto.MyCoAttainmentResponse;
import com.icr.backend.dto.MyPoAttainmentResponse;
import com.icr.backend.entity.User;
import com.icr.backend.enums.RoleType;
import com.icr.backend.exception.ResourceNotFoundException;
import com.icr.backend.outcome.entity.CourseOutcomePOMapping;
import com.icr.backend.outcome.entity.ProgramOutcome;
import com.icr.backend.outcome.repository.CourseOutcomePORepository;
import com.icr.backend.outcome.repository.ProgramOutcomeRepository;
import com.icr.backend.repository.UserRepository;
import com.icr.backend.service.AttainmentService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AttainmentServiceImpl implements AttainmentService {

    private static final double ATTAINED_THRESHOLD = 60.0;
    private static final double PARTIAL_THRESHOLD = 40.0;

    private final CaseSubmissionRepository caseSubmissionRepository;
    private final CaseCoMappingRepository caseCoMappingRepository;
    private final SubmissionCoScoreRepository submissionCoScoreRepository;
    private final CaseStudyRepository caseStudyRepository;
    private final CourseOutcomePORepository courseOutcomePORepository;
    private final ProgramOutcomeRepository programOutcomeRepository;
    private final UserRepository userRepository;

    @Override
    @Transactional(readOnly = true)
    public List<MyCoAttainmentResponse> getStudentCoAttainment(Long studentId) {
        userRepository.findById(studentId)
                .orElseThrow(() -> new ResourceNotFoundException("Student not found with id: " + studentId));

        // FIXED: CO attainment now uses evaluated submissions only and computes percentage from achieved/max scores.
        Map<Long, CoAggregate> aggregateByCo = buildCoAggregateByStudent(studentId);
        return aggregateByCo.entrySet().stream()
                .map(entry -> {
                    CoAggregate aggregate = entry.getValue();
                    double percentage = aggregate.maxScore > 0
                            ? (aggregate.achievedScore * 100.0) / aggregate.maxScore
                            : 0.0;
                    return MyCoAttainmentResponse.builder()
                            .coId(entry.getKey())
                            .coCode(aggregate.coCode)
                            .coDescription(aggregate.coDescription)
                            .percentage(roundTwoDecimals(percentage))
                            .status(resolveStatus(percentage))
                            .build();
                })
                .sorted(Comparator.comparing(MyCoAttainmentResponse::getCoCode, Comparator.nullsLast(String::compareToIgnoreCase)))
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<MyPoAttainmentResponse> getStudentPoAttainment(Long studentId) {
        List<MyCoAttainmentResponse> coAttainment = getStudentCoAttainment(studentId);
        if (coAttainment.isEmpty()) {
            return List.of();
        }

        // FIXED: PO status follows CO-status rollup rules (NOT_ATTAINED > PARTIAL > ATTAINED).
        Map<Long, MyCoAttainmentResponse> coById = coAttainment.stream()
                .collect(Collectors.toMap(MyCoAttainmentResponse::getCoId, item -> item));

        List<CourseOutcomePOMapping> mappings = courseOutcomePORepository.findByCourseOutcomeIdIn(
                new ArrayList<>(coById.keySet())
        );
        if (mappings.isEmpty()) {
            return List.of();
        }

        Map<Long, List<MyCoAttainmentResponse>> cosByPo = new HashMap<>();
        for (CourseOutcomePOMapping mapping : mappings) {
            if (mapping.getProgramOutcome() == null || mapping.getProgramOutcome().getId() == null
                    || mapping.getCourseOutcome() == null || mapping.getCourseOutcome().getId() == null) {
                continue;
            }
            MyCoAttainmentResponse co = coById.get(mapping.getCourseOutcome().getId());
            if (co == null) {
                continue;
            }
            cosByPo.computeIfAbsent(mapping.getProgramOutcome().getId(), ignored -> new ArrayList<>()).add(co);
        }

        Map<Long, ProgramOutcome> poById = programOutcomeRepository.findAllById(cosByPo.keySet()).stream()
                .collect(Collectors.toMap(ProgramOutcome::getId, po -> po));

        return cosByPo.entrySet().stream()
                .map(entry -> {
                    ProgramOutcome po = poById.get(entry.getKey());
                    if (po == null) {
                        return null;
                    }
                    List<MyCoAttainmentResponse> mappedCos = entry.getValue();
                    String status = resolvePoStatus(mappedCos.stream().map(MyCoAttainmentResponse::getStatus).toList());
                    return MyPoAttainmentResponse.builder()
                            .poId(po.getId())
                            .poCode(po.getCode())
                            .poDescription(po.getDescription())
                            .status(status)
                            .mappedCOs(mappedCos.stream().map(MyCoAttainmentResponse::getCoCode).distinct().sorted().toList())
                            .build();
                })
                .filter(Objects::nonNull)
                .sorted(Comparator.comparing(MyPoAttainmentResponse::getPoCode, Comparator.nullsLast(String::compareToIgnoreCase)))
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<AdminCoAttainmentSummaryResponse> getPlatformCoAttainmentSummary() {
        List<User> students = userRepository.findByRole_NameAndDeletedFalse(RoleType.STUDENT);
        if (students.isEmpty()) {
            return List.of();
        }

        Map<Long, CoSummaryAggregate> summaryByCo = new HashMap<>();
        for (User student : students) {
            List<MyCoAttainmentResponse> studentCo = getStudentCoAttainment(student.getId());
            for (MyCoAttainmentResponse row : studentCo) {
                CoSummaryAggregate aggregate = summaryByCo.computeIfAbsent(
                        row.getCoId(),
                        ignored -> new CoSummaryAggregate(row.getCoCode(), row.getCoDescription())
                );
                aggregate.totalStudents++;
                if ("ATTAINED".equals(row.getStatus())) {
                    aggregate.attainedCount++;
                } else if ("PARTIAL".equals(row.getStatus())) {
                    aggregate.partialCount++;
                } else {
                    aggregate.notAttainedCount++;
                }
            }
        }

        return summaryByCo.entrySet().stream()
                .map(entry -> {
                    CoSummaryAggregate item = entry.getValue();
                    double rate = item.totalStudents == 0
                            ? 0.0
                            : (item.attainedCount * 100.0) / item.totalStudents;
                    return AdminCoAttainmentSummaryResponse.builder()
                            .coId(entry.getKey())
                            .coCode(item.coCode)
                            .coDescription(item.coDescription)
                            .totalStudents(item.totalStudents)
                            .attainedCount(item.attainedCount)
                            .partialCount(item.partialCount)
                            .notAttainedCount(item.notAttainedCount)
                            .attainmentRate(roundTwoDecimals(rate))
                            .build();
                })
                .sorted(Comparator.comparing(AdminCoAttainmentSummaryResponse::getCoCode, Comparator.nullsLast(String::compareToIgnoreCase)))
                .toList();
    }

    private Map<Long, CoAggregate> buildCoAggregateByStudent(Long studentId) {
        List<CaseSubmission> evaluatedSubmissions = caseSubmissionRepository
                .findByStudentIdAndStatus(studentId, SubmissionStatus.EVALUATED);
        if (evaluatedSubmissions.isEmpty()) {
            return Map.of();
        }

        Set<Long> caseIds = evaluatedSubmissions.stream()
                .map(CaseSubmission::getCaseId)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());
        Map<Long, CaseStudy> caseById = caseStudyRepository.findAllById(caseIds).stream()
                .collect(Collectors.toMap(CaseStudy::getId, item -> item));
        Map<Long, List<CaseCoMapping>> mappingByCaseId = caseCoMappingRepository.findByCaseStudyIdIn(new ArrayList<>(caseIds))
                .stream()
                .filter(mapping -> mapping.getCaseStudy() != null && mapping.getCaseStudy().getId() != null)
                .collect(Collectors.groupingBy(mapping -> mapping.getCaseStudy().getId()));

        Map<Long, CoAggregate> aggregateByCo = new HashMap<>();
        for (CaseSubmission submission : evaluatedSubmissions) {
            if (submission.getCaseId() == null) {
                continue;
            }
            List<CaseCoMapping> mappings = mappingByCaseId.getOrDefault(submission.getCaseId(), List.of());
            if (mappings.isEmpty()) {
                continue;
            }

            Map<Long, SubmissionCoScore> coScoresByCoId = submissionCoScoreRepository.findBySubmissionId(submission.getId())
                    .stream()
                    .filter(score -> score.getCoId() != null)
                    .collect(Collectors.toMap(SubmissionCoScore::getCoId, score -> score, (a, b) -> b));

            CaseStudy caseStudy = caseById.get(submission.getCaseId());
            int fallbackMax = caseStudy != null && caseStudy.getMaxMarks() != null && caseStudy.getMaxMarks() > 0
                    ? caseStudy.getMaxMarks()
                    : 100;
            Integer fallbackScore = submission.getMarksAwarded();

            for (CaseCoMapping mapping : mappings) {
                if (mapping.getCourseOutcome() == null || mapping.getCourseOutcome().getId() == null) {
                    continue;
                }
                Long coId = mapping.getCourseOutcome().getId();
                SubmissionCoScore coScore = coScoresByCoId.get(coId);

                CoAggregate aggregate = aggregateByCo.computeIfAbsent(
                        coId,
                        ignored -> new CoAggregate(
                                mapping.getCourseOutcome().getCode(),
                                mapping.getCourseOutcome().getDescription()
                        )
                );

                if (coScore != null && coScore.getScore() != null && coScore.getMaxScore() != null && coScore.getMaxScore() > 0) {
                    aggregate.achievedScore += coScore.getScore();
                    aggregate.maxScore += coScore.getMaxScore();
                } else if (fallbackScore != null) {
                    aggregate.achievedScore += fallbackScore;
                    aggregate.maxScore += fallbackMax;
                }
            }
        }

        return aggregateByCo;
    }

    private String resolveStatus(double percentage) {
        if (percentage >= ATTAINED_THRESHOLD) {
            return "ATTAINED";
        }
        if (percentage >= PARTIAL_THRESHOLD) {
            return "PARTIAL";
        }
        return "NOT_ATTAINED";
    }

    private String resolvePoStatus(List<String> statuses) {
        if (statuses.stream().anyMatch("NOT_ATTAINED"::equals)) {
            return "NOT_ATTAINED";
        }
        if (statuses.stream().anyMatch("PARTIAL"::equals)) {
            return "PARTIAL";
        }
        return "ATTAINED";
    }

    private double roundTwoDecimals(double value) {
        return Math.round(value * 100.0) / 100.0;
    }

    private static final class CoAggregate {
        private final String coCode;
        private final String coDescription;
        private double achievedScore;
        private double maxScore;

        private CoAggregate(String coCode, String coDescription) {
            this.coCode = coCode;
            this.coDescription = coDescription;
        }
    }

    private static final class CoSummaryAggregate {
        private final String coCode;
        private final String coDescription;
        private long totalStudents;
        private long attainedCount;
        private long partialCount;
        private long notAttainedCount;

        private CoSummaryAggregate(String coCode, String coDescription) {
            this.coCode = coCode;
            this.coDescription = coDescription;
        }
    }
}
