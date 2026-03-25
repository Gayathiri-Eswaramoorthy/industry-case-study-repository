package com.icr.backend.service.impl;

import com.icr.backend.casestudy.enums.SubmissionStatus;
import com.icr.backend.casestudy.entity.CaseCoMapping;
import com.icr.backend.casestudy.entity.CaseSubmission;
import com.icr.backend.casestudy.entity.CaseStudy;
import com.icr.backend.casestudy.repository.CaseCoMappingRepository;
import com.icr.backend.casestudy.repository.CaseSubmissionRepository;
import com.icr.backend.casestudy.repository.CaseStudyRepository;
import com.icr.backend.dto.CoAttainmentSummaryDTO;
import com.icr.backend.dto.DashboardStatsResponse;
import com.icr.backend.dto.FacultyPerformanceDTO;
import com.icr.backend.dto.FacultyStudentSubmissionDTO;
import com.icr.backend.dto.FacultyStudentsBreakdownDTO;
import com.icr.backend.dto.OverallStatsDTO;
import com.icr.backend.dto.TopCaseAnalyticsDTO;
import com.icr.backend.enums.CaseStatus;
import com.icr.backend.enums.RoleType;
import com.icr.backend.enums.UserStatus;
import com.icr.backend.entity.User;
import com.icr.backend.outcome.entity.CourseOutcome;
import com.icr.backend.repository.projection.FacultySubmissionStatusCountProjection;
import com.icr.backend.outcome.repository.CourseOutcomeRepository;
import com.icr.backend.repository.projection.StudentSubmissionStatusCountProjection;
import com.icr.backend.repository.UserRepository;
import com.icr.backend.service.AnalyticsService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class AnalyticsServiceImpl implements AnalyticsService {

    private final UserRepository userRepository;
    private final CaseStudyRepository caseStudyRepository;
    private final CaseSubmissionRepository caseSubmissionRepository;
    private final CaseCoMappingRepository caseCoMappingRepository;
    private final CourseOutcomeRepository courseOutcomeRepository;

    @Override
    @Cacheable("dashboardStats")
    public DashboardStatsResponse getDashboardStats() {
        try {
            long totalUsers = userRepository.count();
            long totalCases = caseStudyRepository.count();
            long totalSubmissions = caseSubmissionRepository.count();
            long activeCases = caseStudyRepository.countByStatus(CaseStatus.PUBLISHED);
            long pendingReviews = caseSubmissionRepository.countByStatus(SubmissionStatus.UNDER_REVIEW);
            long activeFaculty = userRepository.countByRole_Name(RoleType.FACULTY);

            return new DashboardStatsResponse(
                    totalUsers,
                    totalCases,
                    totalSubmissions,
                    activeCases,
                    pendingReviews,
                    activeFaculty
            );
        } catch (Exception ex) {
            log.error("Failed to compute dashboard analytics, returning defaults", ex);
            return new DashboardStatsResponse(0L, 0L, 0L, 0L, 0L, 0L);
        }
    }

    @Override
    @Cacheable("userAnalytics")
    public Map<String, Long> getUserAnalytics() {
        return Map.of(
                "totalUsers", userRepository.count(),
                "activeFaculty", userRepository.countByRole_Name(RoleType.FACULTY),
                "students", userRepository.countByRole_Name(RoleType.STUDENT),
                "admins", userRepository.countByRole_Name(RoleType.ADMIN)
        );
    }

    @Override
    @Cacheable("caseAnalytics")
    public Map<String, Long> getCaseAnalytics() {
        return Map.of(
                "totalCases", caseStudyRepository.count(),
                "draftCases", caseStudyRepository.countByStatus(CaseStatus.DRAFT),
                "publishedCases", caseStudyRepository.countByStatus(CaseStatus.PUBLISHED),
                "submissionOpenCases", caseStudyRepository.countByStatus(CaseStatus.SUBMISSION_OPEN)
        );
    }

    @Override
    @Cacheable("submissionAnalytics")
    public Map<String, Long> getSubmissionAnalytics() {
        return Map.of(
                "totalSubmissions", caseSubmissionRepository.count(),
                "submitted", caseSubmissionRepository.countByStatus(SubmissionStatus.SUBMITTED),
                "underReview", caseSubmissionRepository.countByStatus(SubmissionStatus.UNDER_REVIEW),
                "evaluated", caseSubmissionRepository.countByStatus(SubmissionStatus.EVALUATED)
        );
    }

    @Override
    public List<CoAttainmentSummaryDTO> getCoAttainmentSummary() {
        List<CaseSubmission> evaluatedSubmissions =
                caseSubmissionRepository.findByStatusAndMarksAwardedIsNotNull(SubmissionStatus.EVALUATED);

        if (evaluatedSubmissions.isEmpty()) {
            return List.of();
        }

        Set<Long> caseIds = evaluatedSubmissions.stream()
                .map(CaseSubmission::getCaseId)
                .filter(id -> id != null)
                .collect(Collectors.toSet());

        if (caseIds.isEmpty()) {
            return List.of();
        }

        Map<Long, List<CaseCoMapping>> coMappingsByCaseId = caseCoMappingRepository
                .findByCaseStudyIdIn(new ArrayList<>(caseIds))
                .stream()
                .filter(mapping -> mapping.getCaseStudy() != null && mapping.getCaseStudy().getId() != null)
                .filter(mapping -> mapping.getCourseOutcome() != null && mapping.getCourseOutcome().getId() != null)
                .collect(Collectors.groupingBy(mapping -> mapping.getCaseStudy().getId()));

        if (coMappingsByCaseId.isEmpty()) {
            return List.of();
        }

        Map<Long, List<Integer>> scoresByCoId = new HashMap<>();
        for (CaseSubmission submission : evaluatedSubmissions) {
            if (submission.getCaseId() == null || submission.getMarksAwarded() == null) {
                continue;
            }

            List<CaseCoMapping> mappings = coMappingsByCaseId.get(submission.getCaseId());
            if (mappings == null || mappings.isEmpty()) {
                continue;
            }

            for (CaseCoMapping mapping : mappings) {
                Long coId = mapping.getCourseOutcome().getId();
                scoresByCoId.computeIfAbsent(coId, k -> new ArrayList<>())
                        .add(submission.getMarksAwarded());
            }
        }

        if (scoresByCoId.isEmpty()) {
            return List.of();
        }

        Map<Long, CourseOutcome> outcomesById = courseOutcomeRepository.findAllById(scoresByCoId.keySet())
                .stream()
                .collect(Collectors.toMap(CourseOutcome::getId, outcome -> outcome));

        return scoresByCoId.entrySet().stream()
                .map(entry -> {
                    CourseOutcome outcome = outcomesById.get(entry.getKey());
                    if (outcome == null) {
                        return null;
                    }

                    List<Integer> scores = entry.getValue();
                    long totalCount = scores.size();
                    long attainedCount = scores.stream().filter(score -> score >= 60).count();
                    double averageScore = scores.stream()
                            .mapToInt(Integer::intValue)
                            .average()
                            .orElse(0.0);

                    return CoAttainmentSummaryDTO.builder()
                            .coCode(outcome.getCode())
                            .coDescription(outcome.getDescription())
                            .averageScore(Math.round(averageScore * 100.0) / 100.0)
                            .attainedCount(attainedCount)
                            .totalCount(totalCount)
                            .build();
                })
                .filter(dto -> dto != null)
                .sorted(Comparator.comparing(CoAttainmentSummaryDTO::getCoCode,
                        Comparator.nullsLast(String::compareToIgnoreCase)))
                .toList();
    }

    @Override
    public List<TopCaseAnalyticsDTO> getTopCases() {
        List<CaseSubmission> evaluatedSubmissions =
                caseSubmissionRepository.findByStatusAndMarksAwardedIsNotNull(SubmissionStatus.EVALUATED);

        if (evaluatedSubmissions.isEmpty()) {
            return List.of();
        }

        Map<Long, List<Integer>> scoresByCaseId = evaluatedSubmissions.stream()
                .filter(submission -> submission.getCaseId() != null && submission.getMarksAwarded() != null)
                .collect(Collectors.groupingBy(
                        CaseSubmission::getCaseId,
                        Collectors.mapping(CaseSubmission::getMarksAwarded, Collectors.toList())
                ));

        if (scoresByCaseId.isEmpty()) {
            return List.of();
        }

        Set<Long> caseIds = scoresByCaseId.keySet();
        Map<Long, String> titleByCaseId = caseStudyRepository.findAllById(caseIds).stream()
                .collect(Collectors.toMap(CaseStudy::getId, CaseStudy::getTitle));

        return scoresByCaseId.entrySet().stream()
                .map(entry -> {
                    List<Integer> scores = entry.getValue();
                    double average = scores.stream().mapToInt(Integer::intValue).average().orElse(0.0);
                    int topScore = scores.stream().mapToInt(Integer::intValue).max().orElse(0);

                    return TopCaseAnalyticsDTO.builder()
                            .caseId(entry.getKey())
                            .caseTitle(titleByCaseId.getOrDefault(entry.getKey(), "Case #" + entry.getKey()))
                            .submissionCount(scores.size())
                            .averageScore(Math.round(average * 100.0) / 100.0)
                            .topScore(topScore)
                            .build();
                })
                .sorted(Comparator.comparing(TopCaseAnalyticsDTO::getAverageScore).reversed())
                .limit(5)
                .toList();
    }

    @Override
    public List<FacultyPerformanceDTO> getFacultyPerformance() {
        Map<Long, Map<SubmissionStatus, Long>> facultySubmissionCounts = caseSubmissionRepository
                .findFacultySubmissionStatusCounts()
                .stream()
                .collect(Collectors.groupingBy(
                        FacultySubmissionStatusCountProjection::getFacultyId,
                        Collectors.toMap(
                                FacultySubmissionStatusCountProjection::getStatus,
                                row -> row.getTotal() == null ? 0L : row.getTotal(),
                                Long::sum
                        )
                ));

        return userRepository.fetchFacultyStudentAnalytics().stream()
                .map(row -> {
                    long total = row.getTotalStudents() == null ? 0L : row.getTotalStudents();
                    long approved = row.getApprovedStudents() == null ? 0L : row.getApprovedStudents();
                    long rejected = row.getRejectedStudents() == null ? 0L : row.getRejectedStudents();
                    long pending = row.getPendingStudents() == null ? 0L : row.getPendingStudents();
                    double approvalRate = total == 0 ? 0.0 : Math.round((approved * 10000.0) / total) / 100.0;
                    Map<SubmissionStatus, Long> statusCounts = facultySubmissionCounts
                            .getOrDefault(row.getFacultyId(), Map.of());
                    long submitted = statusCounts.getOrDefault(SubmissionStatus.SUBMITTED, 0L);
                    long underReview = statusCounts.getOrDefault(SubmissionStatus.UNDER_REVIEW, 0L);
                    long reevalRequested = statusCounts.getOrDefault(SubmissionStatus.REEVAL_REQUESTED, 0L);
                    long evaluated = statusCounts.getOrDefault(SubmissionStatus.EVALUATED, 0L);
                    long totalSubmissions = submitted + underReview + reevalRequested + evaluated;

                    return FacultyPerformanceDTO.builder()
                            .facultyId(row.getFacultyId())
                            .facultyName(row.getFacultyName())
                            .totalStudents(total)
                            .totalSubmissions(totalSubmissions)
                            .submitted(submitted)
                            .underReview(underReview)
                            .reevalRequested(reevalRequested)
                            .evaluated(evaluated)
                            .approved(approved)
                            .rejected(rejected)
                            .pending(pending)
                            .approvalRate(approvalRate)
                            .build();
                })
                .sorted(Comparator.comparing(FacultyPerformanceDTO::getApprovalRate).reversed()
                        .thenComparing(FacultyPerformanceDTO::getTotalStudents, Comparator.reverseOrder())
                        .thenComparing(FacultyPerformanceDTO::getFacultyName, Comparator.nullsLast(String::compareToIgnoreCase)))
                .toList();
    }

    @Override
    public FacultyStudentsBreakdownDTO getFacultyStudentsBreakdown(Long facultyId) {
        Optional<User> facultyOpt = userRepository.findById(facultyId);
        User faculty = facultyOpt
                .filter(user -> user.getRole() != null && user.getRole().getName() == RoleType.FACULTY)
                .orElseThrow(() -> new IllegalArgumentException("Faculty not found"));

        List<User> allStudents = userRepository.findByRole_NameAndRequestedFacultyId(RoleType.STUDENT, facultyId);

        Map<Long, Map<SubmissionStatus, Long>> studentSubmissionCounts = caseSubmissionRepository
                .findStudentSubmissionStatusCountsByFacultyId(facultyId)
                .stream()
                .collect(Collectors.groupingBy(
                        StudentSubmissionStatusCountProjection::getStudentId,
                        Collectors.toMap(
                                StudentSubmissionStatusCountProjection::getStatus,
                                row -> row.getTotal() == null ? 0L : row.getTotal(),
                                Long::sum
                        )
                ));

        List<FacultyStudentSubmissionDTO> approved = new ArrayList<>();
        List<FacultyStudentSubmissionDTO> pending = new ArrayList<>();
        List<FacultyStudentSubmissionDTO> rejected = new ArrayList<>();

        for (User student : allStudents) {
            FacultyStudentSubmissionDTO dto = buildStudentSubmissionDto(student, studentSubmissionCounts.get(student.getId()));
            if (student.getStatus() == UserStatus.APPROVED) {
                approved.add(dto);
            } else if (student.getStatus() == UserStatus.REJECTED) {
                rejected.add(dto);
            } else if (student.getStatus() == UserStatus.PENDING || student.getStatus() == UserStatus.PENDING_FACULTY_APPROVAL) {
                pending.add(dto);
            }
        }

        Comparator<FacultyStudentSubmissionDTO> byName = Comparator.comparing(
                FacultyStudentSubmissionDTO::getStudentName,
                Comparator.nullsLast(String::compareToIgnoreCase)
        );
        approved.sort(byName);
        pending.sort(byName);
        rejected.sort(byName);

        return FacultyStudentsBreakdownDTO.builder()
                .facultyId(faculty.getId())
                .facultyName(faculty.getFullName())
                .approvedStudents(approved)
                .pendingStudents(pending)
                .rejectedStudents(rejected)
                .build();
    }

    @Override
    public OverallStatsDTO getOverallStats() {
        DashboardStatsResponse dashboard = getDashboardStats();
        List<FacultyPerformanceDTO> facultyPerformance = getFacultyPerformance();

        long approved = facultyPerformance.stream().mapToLong(FacultyPerformanceDTO::getApproved).sum();
        long pending = facultyPerformance.stream().mapToLong(FacultyPerformanceDTO::getPending).sum();
        long rejected = facultyPerformance.stream().mapToLong(FacultyPerformanceDTO::getRejected).sum();
        long totalStudentsWithMapping = approved + pending + rejected;
        double approvalRate = totalStudentsWithMapping == 0
                ? 0.0
                : Math.round((approved * 10000.0) / totalStudentsWithMapping) / 100.0;

        return OverallStatsDTO.builder()
                .totalUsers(dashboard.getTotalUsers())
                .totalFaculty(userRepository.countByRole_Name(RoleType.FACULTY))
                .totalStudents(userRepository.countByRole_Name(RoleType.STUDENT))
                .totalCases(dashboard.getTotalCases())
                .totalSubmissions(dashboard.getTotalSubmissions())
                .approvedStudents(approved)
                .pendingStudents(pending)
                .rejectedStudents(rejected)
                .overallApprovalRate(approvalRate)
                .build();
    }

    private FacultyStudentSubmissionDTO buildStudentSubmissionDto(User student, Map<SubmissionStatus, Long> statusCounts) {
        Map<SubmissionStatus, Long> safeCounts = statusCounts == null ? Map.of() : statusCounts;
        long submitted = safeCounts.getOrDefault(SubmissionStatus.SUBMITTED, 0L);
        long underReview = safeCounts.getOrDefault(SubmissionStatus.UNDER_REVIEW, 0L);
        long reevalRequested = safeCounts.getOrDefault(SubmissionStatus.REEVAL_REQUESTED, 0L);
        long evaluated = safeCounts.getOrDefault(SubmissionStatus.EVALUATED, 0L);
        long totalSubmissions = submitted + underReview + reevalRequested + evaluated;

        return FacultyStudentSubmissionDTO.builder()
                .studentId(student.getId())
                .studentName(student.getFullName())
                .email(student.getEmail())
                .status(student.getStatus() == null ? null : student.getStatus().name())
                .totalSubmissions(totalSubmissions)
                .submitted(submitted)
                .underReview(underReview)
                .reevalRequested(reevalRequested)
                .evaluated(evaluated)
                .build();
    }
}
