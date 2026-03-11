package com.icr.backend.service.impl;

import com.icr.backend.casestudy.enums.SubmissionStatus;
import com.icr.backend.casestudy.entity.CaseStudy;
import com.icr.backend.casestudy.repository.CaseSubmissionRepository;
import com.icr.backend.casestudy.repository.CaseStudyRepository;
import com.icr.backend.dto.FacultyDashboardDTO;
import com.icr.backend.entity.User;
import com.icr.backend.enums.CaseStatus;
import com.icr.backend.repository.UserRepository;
import com.icr.backend.service.FacultyDashboardService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class FacultyDashboardServiceImpl implements FacultyDashboardService {

    private final CaseStudyRepository caseStudyRepository;
    private final CaseSubmissionRepository submissionRepository;
    private final UserRepository userRepository;

    @Override
    public FacultyDashboardDTO getDashboardMetrics() {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth == null || !auth.isAuthenticated()) {
                return new FacultyDashboardDTO(0, 0, 0, 0);
            }

            String email = auth.getName();
            if (email == null || email.isBlank() || "anonymousUser".equalsIgnoreCase(email)) {
                return new FacultyDashboardDTO(0, 0, 0, 0);
            }

            User faculty = userRepository.findByEmail(email)
                    .orElseThrow(() -> new RuntimeException("Faculty not found"));

            Long facultyId = faculty.getId();
            List<Long> facultyCaseIds = caseStudyRepository
                    .findByCreatedBy_Id(facultyId)
                    .stream()
                    .map(CaseStudy::getId)
                    .toList();

            long totalCases = caseStudyRepository.countByCreatedBy_Id(facultyId);
            long pendingReviews = facultyCaseIds.isEmpty()
                    ? 0
                    : submissionRepository.countByCaseIdInAndStatus(facultyCaseIds, SubmissionStatus.SUBMITTED);
            long evaluatedSubmissions = facultyCaseIds.isEmpty()
                    ? 0
                    : submissionRepository.countByCaseIdInAndStatus(facultyCaseIds, SubmissionStatus.EVALUATED);
            long activeCases = caseStudyRepository.countByCreatedBy_IdAndStatus(facultyId, CaseStatus.PUBLISHED);

            return new FacultyDashboardDTO(
                    totalCases,
                    pendingReviews,
                    evaluatedSubmissions,
                    activeCases
            );
        } catch (Exception e) {
            log.error("Error loading faculty dashboard", e);
            return new FacultyDashboardDTO(0, 0, 0, 0);
        }
    }
}
