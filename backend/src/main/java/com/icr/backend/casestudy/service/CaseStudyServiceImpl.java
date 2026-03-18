package com.icr.backend.casestudy.service;

import com.icr.backend.casestudy.dto.CaseStudyRequest;
import com.icr.backend.casestudy.dto.CaseStudyResponse;
import com.icr.backend.casestudy.dto.UpdateCaseStudyRequest;
import com.icr.backend.casestudy.entity.CaseStudy;
import com.icr.backend.casestudy.enums.ActivityEvent;
import com.icr.backend.casestudy.enums.CaseCategory;
import com.icr.backend.casestudy.enums.SubmissionType;
import com.icr.backend.casestudy.repository.CaseCoMappingRepository;
import com.icr.backend.casestudy.repository.CaseStudyRepository;
import com.icr.backend.course.entity.Course;
import com.icr.backend.course.repository.CourseRepository;
import com.icr.backend.entity.User;
import com.icr.backend.enums.CaseStatus;
import com.icr.backend.exception.ResourceNotFoundException;
import com.icr.backend.repository.UserRepository;
import com.icr.backend.service.ActivityService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class CaseStudyServiceImpl implements CaseStudyService {

    private final CaseStudyRepository caseStudyRepository;
    private final CourseRepository courseRepository;
    private final UserRepository userRepository;
    private final ActivityService activityService;
    private final CaseCoMappingService caseCoMappingService;
    private final CaseCoMappingRepository caseCoMappingRepository;

    @Override
    public CaseStudyResponse createCase(CaseStudyRequest request) {

        Course course = courseRepository.findById(request.getCourseId())
                .orElseThrow(() -> new IllegalArgumentException("Course not found"));

        var authentication = SecurityContextHolder.getContext().getAuthentication();

        if (authentication == null || !authentication.isAuthenticated()) {
            throw new RuntimeException("User not authenticated");
        }

        String email = authentication.getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        CaseStudy caseStudy = CaseStudy.builder()
                .title(request.getTitle())
                .description(request.getDescription())
                .difficulty(request.getDifficulty())
                .status(CaseStatus.DRAFT)
                .course(course)
                .createdBy(user)
                .dueDate(request.getDueDate())
                .maxMarks(request.getMaxMarks())
                .category(request.getCategory() != null ? request.getCategory() : CaseCategory.PRODUCT)
                .submissionType(request.getSubmissionType() != null ? request.getSubmissionType() : SubmissionType.TEXT)
                .caseMaterialPath(request.getCaseMaterialPath())
                .problemStatement(request.getProblemStatement())
                .keyQuestions(request.getKeyQuestions())
                .evaluationRubric(request.getEvaluationRubric())
                .constraints(request.getConstraints())
                .expectedOutcome(request.getExpectedOutcome())
                .referenceLinks(request.getReferenceLinks())
                .estimatedHours(request.getEstimatedHours())
                .build();

        CaseStudy saved = caseStudyRepository.save(caseStudy);
        saveCaseCoMappings(saved.getId(), request.getCoIds());

        return mapToResponse(saved);
    }

    @Override
    public Page<CaseStudyResponse> getAllCases(CaseStatus status, Pageable pageable) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();

        boolean isAdmin = auth != null && auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        boolean isFaculty = auth != null && auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_FACULTY"));

        if (isAdmin) {
            return caseStudyRepository.findAllVisibleCases(status, pageable).map(this::mapToResponse);
        }

        if (isFaculty) {
            String email = auth.getName();
            User faculty = userRepository.findByEmail(email)
                    .orElseThrow(() -> new RuntimeException("User not found"));

            return caseStudyRepository.findVisibleCasesForFaculty(faculty.getId(), status, pageable)
                    .map(this::mapToResponse);
        }

        Page<CaseStudy> page = caseStudyRepository.findByStatus(CaseStatus.PUBLISHED, pageable);
        return page.map(this::mapToResponse);
    }

    @Override
    public Page<CaseStudyResponse> getCasesByCourse(Long courseId, CaseStatus status, Pageable pageable) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();

        boolean isAdmin = auth != null && auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        boolean isFaculty = auth != null && auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_FACULTY"));
        if (isAdmin) {
            Page<CaseStudy> page = status != null
                    ? caseStudyRepository.findByCourseIdAndStatus(courseId, status, pageable)
                    : caseStudyRepository.findByCourseId(courseId, pageable);
            return page.map(this::mapToResponse);
        }

        if (isFaculty) {
            String email = auth.getName();
            User faculty = userRepository.findByEmail(email)
                    .orElseThrow(() -> new RuntimeException("User not found"));

            return caseStudyRepository.findVisibleCasesForFaculty(courseId, faculty.getId(), status, pageable)
                    .map(this::mapToResponse);
        }

        Page<CaseStudy> page = caseStudyRepository.findByCourseIdAndStatus(courseId, CaseStatus.PUBLISHED, pageable);
        return page.map(this::mapToResponse);
    }

    @Override
    public List<CaseStudyResponse> getCasesByCourseAndStatus(Long courseId, CaseStatus status) {
        return caseStudyRepository.findByCourseIdAndStatus(courseId, status)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    public List<CaseStudyResponse> getPublishedCasesByCourse(Long courseId) {
        return caseStudyRepository.findByStatus(CaseStatus.PUBLISHED)
                .stream()
                .filter(caseStudy -> caseStudy.getCourse() != null && caseStudy.getCourse().getId().equals(courseId))
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    public CaseStudyResponse getCaseById(Long id) {
        CaseStudy caseStudy = caseStudyRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Case not found with id: " + id));

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();

        boolean isAdmin = auth != null && auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        boolean isStudent = auth != null && auth.getAuthorities().stream()
                .anyMatch(a -> "ROLE_STUDENT".equals(a.getAuthority()));
        boolean isFaculty = auth != null && auth.getAuthorities().stream()
                .anyMatch(a -> "ROLE_FACULTY".equals(a.getAuthority()));

        if (isAdmin) {
            return mapToResponse(caseStudy);
        }

        if (isStudent && caseStudy.getStatus() != CaseStatus.PUBLISHED) {
            throw new ResourceNotFoundException("Case not found with id: " + id);
        }

        if (isStudent) {
            String email = auth.getName();
            User student = userRepository.findByEmail(email)
                    .orElseThrow(() -> new RuntimeException("User not found"));
            activityService.logEvent(student.getId(), caseStudy.getId(), ActivityEvent.VIEWED);
        }

        if (isFaculty && caseStudy.getStatus() != CaseStatus.PUBLISHED) {
            String email = auth.getName();
            User faculty = userRepository.findByEmail(email)
                    .orElseThrow(() -> new RuntimeException("User not found"));
            boolean isOwner = caseStudy.getCreatedBy() != null
                    && caseStudy.getCreatedBy().getId().equals(faculty.getId());
            if (!isOwner) {
                throw new ResourceNotFoundException("Case not found with id: " + id);
            }
        }

        return mapToResponse(caseStudy);
    }

    @Override
    public CaseStudyResponse publishCase(Long caseId) {
        return updateCaseStatus(caseId, CaseStatus.PUBLISHED);
    }

    @Override
    public CaseStudyResponse updateCaseStatus(Long caseId, CaseStatus newStatus) {

        CaseStudy caseStudy = caseStudyRepository.findById(caseId)
                .orElseThrow(() -> new RuntimeException("Case not found"));

        CaseStatus currentStatus = caseStudy.getStatus();
        if (!isValidTransition(currentStatus, newStatus)) {
            throw new IllegalArgumentException(
                    "Invalid status transition: " + currentStatus + " -> " + newStatus
            );
        }

        caseStudy.setStatus(newStatus);
        return mapToResponse(caseStudyRepository.save(caseStudy));
    }

    @Override
    public CaseStudyResponse updateCase(Long caseId, UpdateCaseStudyRequest request) {
        try {
            CaseStudy caseStudy = caseStudyRepository.findById(caseId)
                    .orElseThrow(() -> new ResourceNotFoundException("Case not found"));

            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            if (authentication == null || !authentication.isAuthenticated()) {
                throw new AccessDeniedException("User not authenticated");
            }

            User user = userRepository.findByEmail(authentication.getName())
                    .orElseThrow(() -> new AccessDeniedException("User not found"));

            boolean isAdmin = authentication.getAuthorities().stream()
                    .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));

            boolean isOwner = caseStudy.getCreatedBy() != null
                    && caseStudy.getCreatedBy().getId() != null
                    && caseStudy.getCreatedBy().getId().equals(user.getId());

            if (!isAdmin && !isOwner) {
                throw new AccessDeniedException("You can only edit your own cases");
            }

            if (caseStudy.getStatus() == CaseStatus.DRAFT) {
                if (request.getTitle() != null) caseStudy.setTitle(request.getTitle());
                if (request.getDescription() != null) caseStudy.setDescription(request.getDescription());
                if (request.getCategory() != null) caseStudy.setCategory(parseCategory(request.getCategory()));
                if (request.getDifficulty() != null) caseStudy.setDifficulty(request.getDifficulty());
                if (request.getDueDate() != null) caseStudy.setDueDate(request.getDueDate().atStartOfDay());
                if (request.getMaxMarks() != null) caseStudy.setMaxMarks(request.getMaxMarks());
                if (request.getSubmissionType() != null) caseStudy.setSubmissionType(request.getSubmissionType());
                if (request.getCourseId() != null) {
                    Course course = courseRepository.findById(request.getCourseId())
                            .orElseThrow(() -> new ResourceNotFoundException("Course not found"));
                    caseStudy.setCourse(course);
                }
                if (request.getCoIds() != null) {
                    caseCoMappingRepository.deleteAllByCaseStudyId(caseId);
                    saveCaseCoMappings(caseId, request.getCoIds());
                }
            } else if (caseStudy.getStatus() == CaseStatus.PUBLISHED) {
                if (request.getDueDate() != null) caseStudy.setDueDate(request.getDueDate().atStartOfDay());
                if (request.getMaxMarks() != null) caseStudy.setMaxMarks(request.getMaxMarks());
            }

            CaseStudy saved = caseStudyRepository.save(caseStudy);
            return mapToResponse(saved);
        } catch (Exception ex) {
            log.error("Failed to update case {}", caseId, ex);
            throw ex;
        }
    }

    @Override
    public void deleteCase(Long caseId) {
        CaseStudy caseStudy = caseStudyRepository.findById(caseId)
                .orElseThrow(() -> new ResourceNotFoundException("Case not found with id: " + caseId));

        caseCoMappingRepository.deleteAllByCaseStudyId(caseId);
        caseStudyRepository.delete(caseStudy);
    }

    private boolean isValidTransition(CaseStatus currentStatus, CaseStatus newStatus) {
        if (currentStatus == null || newStatus == null) {
            return false;
        }

        Map<CaseStatus, CaseStatus> validNextTransition = Map.of(
                CaseStatus.DRAFT, CaseStatus.PUBLISHED,
                CaseStatus.PUBLISHED, CaseStatus.ARCHIVED
        );

        return validNextTransition.get(currentStatus) == newStatus;
    }

    private CaseStudyResponse mapToResponse(CaseStudy caseStudy) {
        return CaseStudyResponse.builder()
                .id(caseStudy.getId())
                .title(caseStudy.getTitle())
                .description(caseStudy.getDescription())
                .difficulty(caseStudy.getDifficulty())
                .status(caseStudy.getStatus())
                .courseId(caseStudy.getCourse().getId())
                .createdBy(caseStudy.getCreatedBy().getId())
                .dueDate(caseStudy.getDueDate())
                .maxMarks(caseStudy.getMaxMarks())
                .category(caseStudy.getCategory())
                .submissionType(caseStudy.getSubmissionType())
                .caseMaterialPath(caseStudy.getCaseMaterialPath())
                .problemStatement(caseStudy.getProblemStatement())
                .keyQuestions(caseStudy.getKeyQuestions())
                .evaluationRubric(caseStudy.getEvaluationRubric())
                .constraints(caseStudy.getConstraints())
                .referenceLinks(caseStudy.getReferenceLinks())
                .estimatedHours(caseStudy.getEstimatedHours())
                .coIds(caseCoMappingService.getCoIdsForCase(caseStudy.getId()))
                .createdAt(caseStudy.getCreatedAt())
                .build();
    }

    private void saveCaseCoMappings(Long caseId, List<Long> coIds) {
        if (coIds == null || coIds.isEmpty()) {
            return;
        }

        coIds.stream()
                .filter(Objects::nonNull)
                .distinct()
                .forEach(coId -> caseCoMappingService.mapCaseToCo(caseId, coId));
    }

    private CaseCategory parseCategory(String categoryValue) {
        try {
            return CaseCategory.valueOf(categoryValue.trim().toUpperCase());
        } catch (Exception ex) {
            throw new IllegalArgumentException("Invalid category: " + categoryValue);
        }
    }
}
