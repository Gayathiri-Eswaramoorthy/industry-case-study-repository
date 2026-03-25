package com.icr.backend.service.impl;

import com.icr.backend.casestudy.enums.SubmissionStatus;
import com.icr.backend.casestudy.repository.CaseStudyRepository;
import com.icr.backend.casestudy.repository.CaseSubmissionRepository;
import com.icr.backend.dto.StudentDashboardDTO;
import com.icr.backend.entity.User;
import com.icr.backend.enums.CaseStatus;
import com.icr.backend.repository.UserRepository;
import com.icr.backend.service.StudentDashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class StudentDashboardServiceImpl implements StudentDashboardService {

    private final CaseStudyRepository caseStudyRepository;
    private final CaseSubmissionRepository caseSubmissionRepository;
    private final UserRepository userRepository;

    @Override
    public StudentDashboardDTO getDashboardData() {
        User student = getAuthenticatedUser();

        long totalCases = caseStudyRepository.countByStatus(CaseStatus.PUBLISHED);
        long activeCases = caseStudyRepository.countByStatusAndDueDateGreaterThanEqual(
                CaseStatus.PUBLISHED,
                LocalDateTime.now()
        );
        long mySubmissions = caseSubmissionRepository.countVisibleSubmissionsForStudent(student.getId());
        long submitted = mySubmissions;
        long pendingReview = caseSubmissionRepository.countVisibleSubmissionsForStudentByStatusIn(
                student.getId(),
                List.of(SubmissionStatus.SUBMITTED, SubmissionStatus.UNDER_REVIEW)
        );

        long completionRate = 0L;
        if (totalCases > 0) {
            completionRate = Math.round((submitted * 100.0) / totalCases);
        }

        return new StudentDashboardDTO(
                totalCases,
                mySubmissions,
                completionRate,
                activeCases,
                submitted,
                pendingReview
        );
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
