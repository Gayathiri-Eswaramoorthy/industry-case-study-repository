package com.icr.backend.service.impl;

import com.icr.backend.casestudy.entity.CaseStudy;
import com.icr.backend.casestudy.entity.CaseSubmission;
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
import java.util.Map;
import java.util.Set;
import java.util.Comparator;
import java.util.stream.Collectors;

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

            List<CaseSubmission> submissions = submissionRepository.findAllByStudentFacultyId(faculty.getId());
            if (submissions.isEmpty()) {
                return new FacultyAnalyticsDTO(0, 0, 0, 0, List.of());
            }

            long total = submissions.size();
            long evaluated = submissions.stream()
                    .filter(s -> s.getStatus() == SubmissionStatus.EVALUATED)
                    .count();
            long pending = submissions.stream()
                    .filter(s -> s.getStatus() == SubmissionStatus.SUBMITTED
                            || s.getStatus() == SubmissionStatus.UNDER_REVIEW
                            || s.getStatus() == SubmissionStatus.REEVAL_REQUESTED)
                    .count();

            Set<Long> caseIds = submissions.stream()
                    .map(CaseSubmission::getCaseId)
                    .filter(id -> id != null)
                    .collect(Collectors.toSet());

            Map<Long, String> caseTitleById = caseStudyRepository.findAllById(caseIds).stream()
                    .collect(Collectors.toMap(CaseStudy::getId, CaseStudy::getTitle));

            List<FacultyCaseSubmissionCountDTO> submissionsPerCase = submissions.stream()
                    .filter(s -> s.getCaseId() != null)
                    .collect(Collectors.groupingBy(CaseSubmission::getCaseId, Collectors.counting()))
                    .entrySet()
                    .stream()
                    .map(entry -> new FacultyCaseSubmissionCountDTO(
                            caseTitleById.getOrDefault(entry.getKey(), "Case #" + entry.getKey()),
                            entry.getValue()
                    ))
                    .sorted(Comparator.comparing(FacultyCaseSubmissionCountDTO::getCaseTitle, String.CASE_INSENSITIVE_ORDER))
                    .toList();

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
