package com.icr.backend.service.impl;

import com.icr.backend.casestudy.enums.SubmissionStatus;
import com.icr.backend.casestudy.repository.CaseSubmissionRepository;
import com.icr.backend.casestudy.repository.CaseStudyRepository;
import com.icr.backend.dto.DashboardStatsResponse;
import com.icr.backend.enums.CaseStatus;
import com.icr.backend.enums.RoleType;
import com.icr.backend.repository.UserRepository;
import com.icr.backend.service.AnalyticsService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class AnalyticsServiceImpl implements AnalyticsService {

    private final UserRepository userRepository;
    private final CaseStudyRepository caseStudyRepository;
    private final CaseSubmissionRepository caseSubmissionRepository;

    @Override
    @Cacheable("dashboardStats")
    public DashboardStatsResponse getDashboardStats() {
        try {
            long totalUsers = userRepository.count();
            long totalCases = caseStudyRepository.count();
            long totalSubmissions = caseSubmissionRepository.count();
            long activeCases = caseStudyRepository.countByStatusIn(
                    List.of(CaseStatus.PUBLISHED, CaseStatus.SUBMISSION_OPEN)
            );
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
}
