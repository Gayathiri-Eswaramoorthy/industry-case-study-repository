package com.icr.backend.controller;

import com.icr.backend.casestudy.entity.CaseStudy;
import com.icr.backend.casestudy.entity.CaseSubmission;
import com.icr.backend.casestudy.enums.SubmissionStatus;
import com.icr.backend.casestudy.repository.CaseStudyRepository;
import com.icr.backend.casestudy.repository.CaseSubmissionRepository;
import com.icr.backend.dto.ActivityItemResponse;
import com.icr.backend.entity.User;
import com.icr.backend.enums.RoleType;
import com.icr.backend.repository.UserRepository;
import com.icr.backend.service.ActivityService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class NotificationController {

    private final ActivityService activityService;
    private final UserRepository userRepository;
    private final CaseSubmissionRepository caseSubmissionRepository;
    private final CaseStudyRepository caseStudyRepository;

    @GetMapping("/notifications")
    @PreAuthorize("hasAnyRole('ADMIN','FACULTY','STUDENT')")
    public List<ActivityItemResponse> getNotifications(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return List.of();
        }

        String email = authentication.getName();
        if (email == null || email.isBlank() || "anonymousUser".equalsIgnoreCase(email)) {
            return List.of();
        }

        User user = userRepository.findByEmail(email).orElse(null);
        if (user == null || user.getRole() == null || user.getRole().getName() == null) {
            return List.of();
        }

        RoleType role = user.getRole().getName();
        if (role == RoleType.ADMIN) {
            return activityService.getAdminActivity(10);
        }

        if (role == RoleType.FACULTY) {
            return activityService.getFacultyActivity(10, null);
        }

        List<CaseSubmission> evaluatedSubmissions =
                caseSubmissionRepository.findByStudentIdAndStatus(user.getId(), SubmissionStatus.EVALUATED);
        if (evaluatedSubmissions.isEmpty()) {
            return List.of();
        }

        List<Long> caseIds = evaluatedSubmissions.stream()
                .map(CaseSubmission::getCaseId)
                .distinct()
                .toList();

        Map<Long, String> caseTitleById = new HashMap<>();
        if (!caseIds.isEmpty()) {
            List<CaseStudy> cases = caseStudyRepository.findAllById(caseIds);
            for (CaseStudy caseStudy : cases) {
                caseTitleById.put(caseStudy.getId(), caseStudy.getTitle());
            }
        }

        return evaluatedSubmissions.stream()
                .filter(submission -> submission.getEvaluatedAt() != null)
                .sorted((left, right) -> right.getEvaluatedAt().compareTo(left.getEvaluatedAt()))
                .limit(10)
                .map(submission -> ActivityItemResponse.builder()
                        .id("evaluation-" + submission.getId())
                        .type("evaluation")
                        .message("Your submission for " +
                                caseTitleById.getOrDefault(submission.getCaseId(), "Case #" + submission.getCaseId()) +
                                " has been evaluated")
                        .timestamp(submission.getEvaluatedAt())
                        .build())
                .toList();
    }
}

