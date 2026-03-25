package com.icr.backend.service.impl;

import com.icr.backend.casestudy.enums.SubmissionStatus;
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
@Service
@RequiredArgsConstructor
@Slf4j
public class FacultyDashboardServiceImpl implements FacultyDashboardService {

    private final CaseStudyRepository caseStudyRepository;
    private final CaseSubmissionRepository submissionRepository;
    private final UserRepository userRepository;

    @Override
    public FacultyDashboardDTO getDashboardMetrics() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) {
            return new FacultyDashboardDTO(0, 0, 0, 0, 0);
        }

        String email = auth.getName();
        if (email == null || email.isBlank() || "anonymousUser".equalsIgnoreCase(email)) {
            return new FacultyDashboardDTO(0, 0, 0, 0, 0);
        }

        User faculty = userRepository.findByEmailAndDeletedFalse(email)
                .orElseGet(() -> userRepository.findByEmail(email).orElse(null));
        if (faculty == null || faculty.getId() == null) {
            log.warn("Faculty dashboard requested but user not found for email={}", email);
            return new FacultyDashboardDTO(0, 0, 0, 0, 0);
        }

        Long facultyId = faculty.getId();

        long ownCases = caseStudyRepository.countByCreatedBy_Id(facultyId);
        long publishedCases = caseStudyRepository.countByStatus(CaseStatus.PUBLISHED);
        long totalVisibleCases = caseStudyRepository.countVisibleCasesForFaculty(facultyId);
        long pendingReviews = submissionRepository
                .countByStudentFacultyIdAndStatus(facultyId, SubmissionStatus.SUBMITTED);
        long evaluatedSubmissions = submissionRepository
                .countByStudentFacultyIdAndStatus(facultyId, SubmissionStatus.EVALUATED);

        return new FacultyDashboardDTO(
                totalVisibleCases,
                ownCases,
                pendingReviews,
                evaluatedSubmissions,
                publishedCases
        );
    }
}
