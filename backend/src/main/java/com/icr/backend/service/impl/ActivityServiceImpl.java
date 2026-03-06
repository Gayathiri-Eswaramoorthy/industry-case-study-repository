package com.icr.backend.service.impl;

import com.icr.backend.casestudy.entity.CaseStudy;
import com.icr.backend.casestudy.entity.CaseSubmission;
import com.icr.backend.casestudy.enums.SubmissionStatus;
import com.icr.backend.casestudy.repository.CaseStudyRepository;
import com.icr.backend.casestudy.repository.CaseSubmissionRepository;
import com.icr.backend.dto.ActivityItemResponse;
import com.icr.backend.entity.User;
import com.icr.backend.repository.UserRepository;
import com.icr.backend.service.ActivityService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ActivityServiceImpl implements ActivityService {

    private final UserRepository userRepository;
    private final CaseStudyRepository caseStudyRepository;
    private final CaseSubmissionRepository caseSubmissionRepository;

    @Override
    public List<ActivityItemResponse> getStudentActivity(int limit) {
        String email = getAuthenticatedEmail();
        if (email == null) {
            return List.of();
        }

        User student = userRepository.findByEmail(email).orElse(null);
        if (student == null || student.getId() == null) {
            return List.of();
        }

        List<ActivityItemResponse> items = new ArrayList<>();
        List<CaseSubmission> submissions = caseSubmissionRepository.findByStudentId(student.getId());

        for (CaseSubmission submission : submissions) {
            if (submission == null) {
                continue;
            }

            if (submission.getSubmittedAt() != null) {
                items.add(ActivityItemResponse.builder()
                        .id("sub-" + submission.getId())
                        .type("submission")
                        .message("You submitted Case #" + submission.getCaseId())
                        .timestamp(submission.getSubmittedAt())
                        .build());
            }

            if (submission.getMarksAwarded() != null && submission.getEvaluatedAt() != null) {
                items.add(ActivityItemResponse.builder()
                        .id("grade-" + submission.getId())
                        .type("grade")
                        .message("Submission graded (Marks: " + submission.getMarksAwarded() + ")")
                        .timestamp(submission.getEvaluatedAt())
                        .build());
            }
        }

        return sortAndLimit(items, limit);
    }

    @Override
    public List<ActivityItemResponse> getFacultyActivity(int limit, Long courseId) {
        int safeLimit = sanitizeLimit(limit);
        List<SubmissionStatus> pendingStatuses = List.of(
                SubmissionStatus.SUBMITTED,
                SubmissionStatus.UNDER_REVIEW
        );

        List<CaseSubmission> submissions;
        if (courseId != null) {
            List<Long> caseIds = caseStudyRepository.findByCourseId(courseId)
                    .stream()
                    .map(CaseStudy::getId)
                    .toList();

            if (caseIds.isEmpty()) {
                return List.of();
            }

            submissions = caseSubmissionRepository.findByCaseIdInAndStatusInOrderBySubmittedAtDesc(
                    caseIds,
                    pendingStatuses,
                    PageRequest.of(0, safeLimit)
            );
        } else {
            submissions = caseSubmissionRepository.findByStatusInOrderBySubmittedAtDesc(
                    pendingStatuses,
                    PageRequest.of(0, safeLimit)
            );
        }

        List<ActivityItemResponse> items = new ArrayList<>();
        for (CaseSubmission submission : submissions) {
            if (submission == null || submission.getSubmittedAt() == null) {
                continue;
            }

            items.add(ActivityItemResponse.builder()
                    .id("review-" + submission.getId())
                    .type("review")
                    .message("Submission #" + submission.getId() + " is pending evaluation")
                    .timestamp(submission.getSubmittedAt())
                    .build());
        }

        return sortAndLimit(items, safeLimit);
    }

    @Override
    public List<ActivityItemResponse> getAdminActivity(int limit) {
        int safeLimit = sanitizeLimit(limit);
        List<ActivityItemResponse> items = new ArrayList<>();

        List<User> users = userRepository.findAllByDeletedFalseOrderByCreatedAtDesc(PageRequest.of(0, safeLimit));
        for (User user : users) {
            LocalDateTime timestamp = user != null ? user.getCreatedAt() : null;
            if (timestamp == null) {
                continue;
            }

            items.add(ActivityItemResponse.builder()
                    .id("user-" + user.getId())
                    .type("user")
                    .message("New user registered: " + user.getEmail())
                    .timestamp(timestamp)
                    .build());
        }

        List<CaseStudy> cases = caseStudyRepository.findAllByOrderByCreatedAtDesc(PageRequest.of(0, safeLimit));
        for (CaseStudy caseStudy : cases) {
            LocalDateTime timestamp = caseStudy != null ? caseStudy.getCreatedAt() : null;
            if (timestamp == null) {
                continue;
            }

            items.add(ActivityItemResponse.builder()
                    .id("case-" + caseStudy.getId())
                    .type("case")
                    .message("Case created: " + caseStudy.getTitle())
                    .timestamp(timestamp)
                    .build());
        }

        List<CaseSubmission> submissions = caseSubmissionRepository.findAllByOrderBySubmittedAtDesc(PageRequest.of(0, safeLimit));
        for (CaseSubmission submission : submissions) {
            if (submission == null || submission.getSubmittedAt() == null) {
                continue;
            }

            items.add(ActivityItemResponse.builder()
                    .id("submission-" + submission.getId())
                    .type("submission")
                    .message("New submission received for Case #" + submission.getCaseId())
                    .timestamp(submission.getSubmittedAt())
                    .build());
        }

        return sortAndLimit(items, safeLimit);
    }

    private String getAuthenticatedEmail() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();

        if (auth == null || !auth.isAuthenticated()) {
            return null;
        }

        String email = auth.getName();
        if (email == null || email.isBlank() || "anonymousUser".equalsIgnoreCase(email)) {
            return null;
        }

        return email;
    }

    private List<ActivityItemResponse> sortAndLimit(List<ActivityItemResponse> items, int limit) {
        return items.stream()
                .filter(item -> item.getTimestamp() != null)
                .sorted(Comparator.comparing(ActivityItemResponse::getTimestamp).reversed())
                .limit(sanitizeLimit(limit))
                .toList();
    }

    private int sanitizeLimit(int limit) {
        if (limit <= 0) {
            return 8;
        }
        return Math.min(limit, 50);
    }
}
