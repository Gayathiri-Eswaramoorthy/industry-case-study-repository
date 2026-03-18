package com.icr.backend.service.impl;

import com.icr.backend.casestudy.entity.CaseStudy;
import com.icr.backend.casestudy.entity.CaseStudyActivity;
import com.icr.backend.casestudy.entity.CaseSubmission;
import com.icr.backend.casestudy.enums.ActivityEvent;
import com.icr.backend.casestudy.enums.SubmissionStatus;
import com.icr.backend.casestudy.repository.CaseStudyActivityRepository;
import com.icr.backend.casestudy.repository.CaseStudyRepository;
import com.icr.backend.casestudy.repository.CaseSubmissionRepository;
import com.icr.backend.dto.ActivityItemResponse;
import com.icr.backend.dto.ActivityResponse;
import com.icr.backend.entity.User;
import com.icr.backend.enums.CaseStatus;
import com.icr.backend.exception.ResourceNotFoundException;
import com.icr.backend.repository.UserRepository;
import com.icr.backend.service.ActivityService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Service
@Slf4j
@RequiredArgsConstructor
public class ActivityServiceImpl implements ActivityService {

    private final UserRepository userRepository;
    private final CaseStudyRepository caseStudyRepository;
    private final CaseSubmissionRepository caseSubmissionRepository;
    private final CaseStudyActivityRepository caseStudyActivityRepository;

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

        int safeLimit = sanitizeLimit(limit);
        List<ActivityItemResponse> items = new ArrayList<>();
        List<CaseSubmission> submissions = caseSubmissionRepository.findByStudentId(student.getId());
        List<CaseStudy> recentCases = caseStudyRepository.findByStatusAndCreatedAtAfterOrderByCreatedAtDesc(
                CaseStatus.PUBLISHED,
                LocalDateTime.now().minusDays(30),
                PageRequest.of(0, safeLimit)
        );

        for (CaseStudy caseStudy : recentCases) {
            LocalDateTime timestamp = caseStudy != null ? caseStudy.getCreatedAt() : null;
            if (timestamp == null) {
                continue;
            }

            items.add(ActivityItemResponse.builder()
                    .id("case-" + caseStudy.getId())
                    .type("case")
                    .message("New case available: " + caseStudy.getTitle())
                    .timestamp(timestamp)
                    .build());
        }

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

        return sortAndLimit(items, safeLimit);
    }

    @Override
    public List<ActivityItemResponse> getFacultyActivity(int limit, Long courseId) {
        int safeLimit = sanitizeLimit(limit);
        String email = getAuthenticatedEmail();
        if (email == null) {
            return List.of();
        }

        User faculty = userRepository.findByEmail(email).orElse(null);
        if (faculty == null || faculty.getId() == null) {
            return List.of();
        }

        List<CaseStudy> facultyCases = caseStudyRepository.findByCreatedBy_Id(faculty.getId());
        if (facultyCases.isEmpty()) {
            return List.of();
        }

        Map<Long, CaseStudy> caseById = facultyCases.stream()
                .filter(caseStudy -> caseStudy != null && caseStudy.getId() != null)
                .collect(HashMap::new, (map, caseStudy) -> map.put(caseStudy.getId(), caseStudy), HashMap::putAll);

        List<Long> caseIds = new ArrayList<>(caseById.keySet());
        if (courseId != null) {
            caseIds = facultyCases.stream()
                    .filter(caseStudy -> caseStudy != null
                            && caseStudy.getId() != null
                            && caseStudy.getCourse() != null
                            && courseId.equals(caseStudy.getCourse().getId()))
                    .map(CaseStudy::getId)
                    .toList();
        }

        if (caseIds.isEmpty()) {
            return List.of();
        }

        List<ActivityItemResponse> items = new ArrayList<>();
        for (CaseStudy caseStudy : facultyCases) {
            if (caseStudy == null || caseStudy.getId() == null || caseStudy.getCreatedAt() == null) {
                continue;
            }

            if (courseId != null && (caseStudy.getCourse() == null || !courseId.equals(caseStudy.getCourse().getId()))) {
                continue;
            }

            items.add(ActivityItemResponse.builder()
                    .id("case-" + caseStudy.getId())
                    .type("case")
                    .message("You created: " + caseStudy.getTitle())
                    .timestamp(caseStudy.getCreatedAt())
                    .build());
        }

        List<CaseSubmission> submissions = caseSubmissionRepository.findByCaseIdInOrderBySubmittedAtDesc(caseIds);
        Set<Long> studentIds = submissions.stream()
                .filter(submission -> submission != null && submission.getStudentId() != null)
                .map(CaseSubmission::getStudentId)
                .collect(HashSet::new, HashSet::add, HashSet::addAll);
        Map<Long, String> studentEmailById = new HashMap<>();
        if (!studentIds.isEmpty()) {
            userRepository.findAllById(studentIds).forEach(student -> studentEmailById.put(student.getId(), student.getEmail()));
        }

        for (CaseSubmission submission : submissions) {
            if (submission == null || submission.getSubmittedAt() == null) {
                continue;
            }

            CaseStudy caseStudy = caseById.get(submission.getCaseId());
            if (caseStudy == null) {
                continue;
            }

            String studentEmail = studentEmailById.getOrDefault(submission.getStudentId(), "A student");
            items.add(ActivityItemResponse.builder()
                    .id("submission-" + submission.getId())
                    .type("submission")
                    .message(studentEmail + " submitted: " + caseStudy.getTitle())
                    .timestamp(submission.getSubmittedAt())
                    .build());
        }

        List<CaseStudy> publishedCases = caseStudyRepository.findByCreatedBy_IdAndStatusOrderByUpdatedAtDesc(
                faculty.getId(),
                CaseStatus.PUBLISHED,
                PageRequest.of(0, safeLimit)
        );
        for (CaseStudy caseStudy : publishedCases) {
            LocalDateTime timestamp = caseStudy != null ? caseStudy.getUpdatedAt() : null;
            if (timestamp == null) {
                continue;
            }

            if (courseId != null && (caseStudy.getCourse() == null || !courseId.equals(caseStudy.getCourse().getId()))) {
                continue;
            }

            items.add(ActivityItemResponse.builder()
                    .id("publish-" + caseStudy.getId())
                    .type("publish")
                    .message("Your case '" + caseStudy.getTitle() + "' was published")
                    .timestamp(timestamp)
                    .build());
        }

        return sortAndLimit(items, safeLimit);
    }

    @Override
    public List<ActivityItemResponse> getAdminActivity(int limit) {
        try {
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

            List<CaseStudy> publishedCases = caseStudyRepository.findByStatusOrderByUpdatedAtDesc(
                    CaseStatus.PUBLISHED,
                    PageRequest.of(0, safeLimit)
            );
            for (CaseStudy caseStudy : publishedCases) {
                LocalDateTime timestamp = caseStudy != null ? caseStudy.getUpdatedAt() : null;
                if (timestamp == null) {
                    continue;
                }

                items.add(ActivityItemResponse.builder()
                        .id("publish-" + caseStudy.getId())
                        .type("publish")
                        .message("Case published: " + caseStudy.getTitle())
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
        } catch (Exception ex) {
            log.error("Failed to load admin activity", ex);
            return List.of();
        }
    }

    @Override
    public void logEvent(Long studentId, Long caseStudyId, ActivityEvent event) {
        if (studentId == null || caseStudyId == null || event == null) {
            return;
        }

        boolean alreadyLogged = caseStudyActivityRepository
                .existsByStudentIdAndCaseStudyIdAndEvent(studentId, caseStudyId, event);
        if (alreadyLogged) {
            return;
        }

        User student = userRepository.findById(studentId)
                .orElseThrow(() -> new ResourceNotFoundException("Student not found with id: " + studentId));
        CaseStudy caseStudy = caseStudyRepository.findById(caseStudyId)
                .orElseThrow(() -> new ResourceNotFoundException("Case not found with id: " + caseStudyId));

        CaseStudyActivity activity = CaseStudyActivity.builder()
                .student(student)
                .caseStudy(caseStudy)
                .event(event)
                .timestamp(LocalDateTime.now())
                .build();

        caseStudyActivityRepository.save(activity);
    }

    @Override
    public void logCurrentStudentEvent(Long caseStudyId, ActivityEvent event) {
        String email = getAuthenticatedEmail();
        if (email == null) {
            return;
        }

        User student = userRepository.findByEmail(email).orElse(null);
        if (student == null || student.getId() == null) {
            return;
        }

        logEvent(student.getId(), caseStudyId, event);
    }

    @Override
    public List<ActivityResponse> getStudentCaseTimeline(Long caseStudyId) {
        String email = getAuthenticatedEmail();
        if (email == null) {
            return List.of();
        }

        User student = userRepository.findByEmail(email).orElse(null);
        if (student == null || student.getId() == null) {
            return List.of();
        }

        return caseStudyActivityRepository.findByStudentIdAndCaseStudyIdOrderByTimestampAsc(student.getId(), caseStudyId)
                .stream()
                .map(activity -> ActivityResponse.builder()
                        .event(activity.getEvent().name())
                        .timestamp(activity.getTimestamp())
                        .build())
                .toList();
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
        if (items == null || items.isEmpty()) {
            return Collections.emptyList();
        }

        return items.stream()
                .filter(item -> item.getTimestamp() != null)
                .sorted(Comparator.comparing(ActivityItemResponse::getTimestamp).reversed())
                .limit(sanitizeLimit(limit))
                .toList();
    }

    private int sanitizeLimit(int limit) {
        if (limit <= 0 || limit > 100) {
            return 8;
        }
        return limit;
    }
}
