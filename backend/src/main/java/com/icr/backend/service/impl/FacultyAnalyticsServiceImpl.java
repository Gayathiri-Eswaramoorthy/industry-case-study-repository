package com.icr.backend.service.impl;

import com.icr.backend.casestudy.entity.CaseStudy;
import com.icr.backend.casestudy.enums.SubmissionStatus;
import com.icr.backend.casestudy.repository.CaseSubmissionRepository;
import com.icr.backend.casestudy.repository.CaseStudyRepository;
import com.icr.backend.dto.FacultyAnalyticsDTO;
import com.icr.backend.dto.FacultyCaseSubmissionCountDTO;
import com.icr.backend.entity.User;
import com.icr.backend.repository.UserRepository;
import com.icr.backend.service.FacultyAnalyticsService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class FacultyAnalyticsServiceImpl implements FacultyAnalyticsService {

    private final CaseSubmissionRepository submissionRepository;
    private final CaseStudyRepository caseStudyRepository;
    private final UserRepository userRepository;

    @Override
    public FacultyAnalyticsDTO getAnalytics() {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth == null || !auth.isAuthenticated()) {
                return new FacultyAnalyticsDTO(0, 0, 0, 0, List.of());
            }

            String email = auth.getName();
            if (email == null || email.isBlank() || "anonymousUser".equalsIgnoreCase(email)) {
                return new FacultyAnalyticsDTO(0, 0, 0, 0, List.of());
            }

            User faculty = userRepository.findByEmail(email)
                    .orElseThrow(() -> new RuntimeException("Faculty not found"));

            List<Long> facultyCaseIds = caseStudyRepository.findByCreatedBy_Id(faculty.getId())
                    .stream()
                    .map(CaseStudy::getId)
                    .toList();

            if (facultyCaseIds.isEmpty()) {
                return new FacultyAnalyticsDTO(0, 0, 0, 0, List.of());
            }

            long total = submissionRepository.countByCaseIdInAndStatusIn(
                    facultyCaseIds,
                    List.of(
                            SubmissionStatus.SUBMITTED,
                            SubmissionStatus.UNDER_REVIEW,
                            SubmissionStatus.EVALUATED
                    )
            );

            long evaluated = submissionRepository.countByCaseIdInAndStatus(
                    facultyCaseIds,
                    SubmissionStatus.EVALUATED
            );

            long pending = submissionRepository.countByCaseIdInAndStatus(
                    facultyCaseIds,
                    SubmissionStatus.SUBMITTED
            );

            List<FacultyCaseSubmissionCountDTO> submissionsPerCase =
                    submissionRepository.findSubmissionCountsPerCase(faculty.getId());

            double completionRate = total == 0 ? 0 : (evaluated * 100.0) / total;

            return new FacultyAnalyticsDTO(
                    total,
                    evaluated,
                    pending,
                    completionRate,
                    submissionsPerCase
            );
        } catch (Exception e) {
            log.error("Error loading faculty analytics", e);
            return new FacultyAnalyticsDTO(0, 0, 0, 0, List.of());
        }
    }
}
