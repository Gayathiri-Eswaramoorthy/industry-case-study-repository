package com.icr.backend.casestudy.service;

import com.icr.backend.casestudy.dto.CaseStudyRequest;
import com.icr.backend.casestudy.dto.CaseStudyResponse;
import com.icr.backend.casestudy.dto.CaseExhibitDTO;
import com.icr.backend.casestudy.dto.UpdateCaseStudyRequest;
import com.icr.backend.casestudy.entity.CasePeerReview;
import com.icr.backend.casestudy.entity.CaseExhibit;
import com.icr.backend.casestudy.entity.CaseTag;
import com.icr.backend.casestudy.entity.CaseStudy;
import com.icr.backend.casestudy.enums.ActivityEvent;
import com.icr.backend.casestudy.enums.CaseCategory;
import com.icr.backend.casestudy.enums.DifficultyLevel;
import com.icr.backend.casestudy.enums.PeerReviewStatus;
import com.icr.backend.casestudy.enums.SubmissionType;
import com.icr.backend.casestudy.repository.CaseAssignmentRepository;
import com.icr.backend.casestudy.repository.CaseCoMappingRepository;
import com.icr.backend.casestudy.repository.CaseExhibitRepository;
import com.icr.backend.casestudy.repository.CasePeerReviewRepository;
import com.icr.backend.casestudy.repository.CaseSubmissionRepository;
import com.icr.backend.casestudy.repository.CaseTagRepository;
import com.icr.backend.casestudy.repository.CaseStudyRepository;
import com.icr.backend.casestudy.repository.CaseStudySpecification;
import com.icr.backend.course.entity.Course;
import com.icr.backend.course.repository.CourseRepository;
import com.icr.backend.entity.User;
import com.icr.backend.enums.CaseStatus;
import com.icr.backend.enums.RoleType;
import com.icr.backend.exception.ResourceNotFoundException;
import com.icr.backend.repository.UserRepository;
import com.icr.backend.service.ActivityService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.Comparator;
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
    private final CaseAssignmentRepository caseAssignmentRepository;
    private final CaseExhibitRepository caseExhibitRepository;
    private final CaseTagRepository caseTagRepository;
    private final CaseSubmissionRepository caseSubmissionRepository;
    private final CasePeerReviewRepository casePeerReviewRepository;

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
                .category(parseCategoryEnum(request.getCategory()))
                .submissionType(request.getSubmissionType() != null ? request.getSubmissionType() : SubmissionType.TEXT)
                .groupSubmissionEnabled(request.isGroupSubmissionEnabled())
                .maxGroupSize(request.isGroupSubmissionEnabled() ? request.getMaxGroupSize() : null)
                .caseMaterialPath(request.getCaseMaterialPath())
                .companyName(request.getCompanyName())
                .realCompanyName(request.getRealCompanyName())
                .isDisguised(request.isDisguised())
                .industry(request.getIndustry())
                .geographicRegion(request.getGeographicRegion())
                .protagonistRole(request.getProtagonistRole())
                .publicationYear(request.getPublicationYear())
                .sourceAttribution(request.getSourceAttribution())
                .caseNarrative(request.getCaseNarrative())
                .companyBackground(request.getCompanyBackground())
                .industryContext(request.getIndustryContext())
                .decisionPoint(request.getDecisionPoint())
                .problemStatement(request.getProblemStatement())
                .keyQuestions(request.getKeyQuestions())
                .evaluationRubric(request.getEvaluationRubric())
                .constraints(request.getConstraints())
                .expectedOutcome(request.getExpectedOutcome())
                .teachingNotesText(request.getTeachingNotesText())
                .referenceLinks(request.getReferenceLinks())
                .estimatedHours(request.getEstimatedHours())
                .build();

        CaseStudy saved = caseStudyRepository.save(caseStudy);
        saveCaseTags(saved, request.getTags());
        saveCaseCoMappings(saved.getId(), request.getCoIds());

        return mapToResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
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
    @Transactional(readOnly = true)
    public Page<CaseStudyResponse> searchCases(
            String q, CaseStatus status, String category, String difficulty,
            List<String> tags, Integer minYear, Integer maxYear,
            String sortParam, Pageable pageable) {

        if ("submissionCount".equals(sortParam)) {
            boolean hasFilters = (q != null && !q.isBlank()) || status != null
                    || category != null || difficulty != null
                    || (tags != null && !tags.isEmpty())
                    || minYear != null || maxYear != null;

            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            boolean isAdmin = auth != null && auth.getAuthorities().stream()
                    .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
            boolean isFaculty = auth != null && auth.getAuthorities().stream()
                    .anyMatch(a -> a.getAuthority().equals("ROLE_FACULTY"));

            if (!hasFilters) {
                if (isAdmin) {
                    return caseStudyRepository
                            .findAllOrderBySubmissionCountDesc(pageable)
                            .map(this::mapToResponse);
                }
                if (isFaculty) {
                    String email = auth.getName();
                    User faculty = userRepository.findByEmail(email)
                            .orElseThrow(() -> new RuntimeException("User not found"));
                    return caseStudyRepository
                            .findVisibleCasesForFacultyOrderBySubmissionCountDesc(faculty.getId(), pageable)
                            .map(this::mapToResponse);
                }
                List<CaseStudyResponse> publishedCases = caseStudyRepository.findByStatus(CaseStatus.PUBLISHED).stream()
                        .map(this::mapToResponse)
                        .sorted(Comparator.comparingLong(CaseStudyResponse::getSubmissionCount).reversed())
                        .toList();
                int start = (int) pageable.getOffset();
                int end = Math.min(start + pageable.getPageSize(), publishedCases.size());
                List<CaseStudyResponse> pageContent = start >= publishedCases.size()
                        ? List.of()
                        : publishedCases.subList(start, end);
                return new org.springframework.data.domain.PageImpl<>(pageContent, pageable, publishedCases.size());
            }

            boolean isStudent = !isAdmin && !isFaculty;
            Long facultyId = null;
            if (isFaculty) {
                String email = auth.getName();
                User faculty = userRepository.findByEmail(email)
                        .orElseThrow(() -> new RuntimeException("User not found"));
                facultyId = faculty.getId();
            }

            CaseCategory parsedCategory = parseCategory(category);
            DifficultyLevel parsedDifficulty = parseDifficulty(difficulty);

            Specification<CaseStudy> spec = CaseStudySpecification.build(
                    q, status, parsedCategory, parsedDifficulty,
                    tags, minYear, maxYear, facultyId, isStudent
            );

            List<CaseStudyResponse> all = caseStudyRepository.findAll(spec).stream()
                    .map(this::mapToResponse)
                    .sorted(Comparator.comparingLong(CaseStudyResponse::getSubmissionCount).reversed())
                    .toList();

            int start = (int) pageable.getOffset();
            int end = Math.min(start + pageable.getPageSize(), all.size());
            List<CaseStudyResponse> pageContent = start >= all.size() ? List.of() : all.subList(start, end);

            return new org.springframework.data.domain.PageImpl<>(pageContent, pageable, all.size());
        }

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();

        boolean isAdmin = auth != null && auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        boolean isFaculty = auth != null && auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_FACULTY"));
        boolean isStudent = !isAdmin && !isFaculty;

        Long facultyId = null;
        if (isFaculty) {
            String email = auth.getName();
            User faculty = userRepository.findByEmail(email)
                    .orElseThrow(() -> new RuntimeException("User not found"));
            facultyId = faculty.getId();
        }

        CaseCategory parsedCategory = parseCategory(category);
        DifficultyLevel parsedDifficulty = parseDifficulty(difficulty);

        Specification<CaseStudy> spec = CaseStudySpecification.build(
                q, status, parsedCategory, parsedDifficulty,
                tags, minYear, maxYear, facultyId, isStudent
        );

        return caseStudyRepository.findAll(spec, pageable).map(this::mapToResponse);
    }

    @Override
    @Transactional(readOnly = true)
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
    @Transactional(readOnly = true)
    public CaseStudyResponse getCaseById(Long id) {
        CaseStudy caseStudy = caseStudyRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Case not found with id: " + id));

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        validateCaseVisibility(caseStudy, auth);

        boolean isStudent = auth != null && auth.getAuthorities().stream()
                .anyMatch(a -> "ROLE_STUDENT".equals(a.getAuthority()));

        if (isStudent) {
            String email = auth.getName();
            User student = userRepository.findByEmail(email)
                    .orElseThrow(() -> new RuntimeException("User not found"));
            activityService.logEvent(student.getId(), caseStudy.getId(), ActivityEvent.VIEWED);
        }

        return mapToResponse(caseStudy);
    }

    @Override
    @Transactional(readOnly = true)
    public List<CaseStudyResponse> getRelatedCases(Long id) {
        CaseStudy caseStudy = caseStudyRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Case not found with id: " + id));

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        validateCaseVisibility(caseStudy, auth);

        List<String> tags = caseTagRepository.findByCaseStudyId(id).stream()
                .map(CaseTag::getTag)
                .distinct()
                .toList();
        boolean hasTags = !tags.isEmpty();
        List<String> tagFilter = hasTags ? tags : List.of("__no_tag_match__");

        String industry = caseStudy.getIndustry();
        if (industry != null && industry.isBlank()) {
            industry = null;
        }

        return caseStudyRepository.findRelatedCases(
                        id,
                        caseStudy.getCategory(),
                        industry,
                        hasTags,
                        tagFilter,
                        PageRequest.of(0, 4)
                ).stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Override
    public CaseStudyResponse publishCase(Long caseId) {
        CaseStudy caseStudy = caseStudyRepository.findById(caseId)
                .orElseThrow(() -> new ResourceNotFoundException("Case not found with id: " + caseId));

        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        boolean isAdmin = authentication != null && authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        boolean isFaculty = authentication != null && authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_FACULTY"));

        if (isFaculty && !isAdmin) {
            String email = authentication.getName();
            User faculty = userRepository.findByEmail(email)
                    .orElseThrow(() -> new ResourceNotFoundException("Faculty user not found"));
            boolean isOwner = caseStudy.getCreatedBy() != null
                    && caseStudy.getCreatedBy().getId().equals(faculty.getId());
            if (!isOwner) {
                throw new AccessDeniedException("You can only publish your own cases");
            }
        }

        return updateCaseStatus(caseId, CaseStatus.PUBLISHED);
    }

    @Override
    public CaseStudyResponse archiveCase(Long caseId) {
        return updateCaseStatus(caseId, CaseStatus.ARCHIVED);
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

            if (isAdmin || caseStudy.getStatus() == CaseStatus.DRAFT) {
                if (request.getTitle() != null) caseStudy.setTitle(request.getTitle());
                if (request.getDescription() != null) caseStudy.setDescription(request.getDescription());
                if (request.getCategory() != null) caseStudy.setCategory(parseCategoryOrThrow(request.getCategory()));
                if (request.getDifficulty() != null) caseStudy.setDifficulty(request.getDifficulty());
                if (request.getDueDate() != null) caseStudy.setDueDate(request.getDueDate().atStartOfDay());
                if (request.getCaseMaterialPath() != null) caseStudy.setCaseMaterialPath(request.getCaseMaterialPath());
                if (request.getCompanyName() != null) caseStudy.setCompanyName(request.getCompanyName());
                if (request.getRealCompanyName() != null) caseStudy.setRealCompanyName(request.getRealCompanyName());
                caseStudy.setDisguised(request.isDisguised());
                if (request.getIndustry() != null) caseStudy.setIndustry(request.getIndustry());
                if (request.getGeographicRegion() != null) caseStudy.setGeographicRegion(request.getGeographicRegion());
                if (request.getProtagonistRole() != null) caseStudy.setProtagonistRole(request.getProtagonistRole());
                if (request.getPublicationYear() != null) caseStudy.setPublicationYear(request.getPublicationYear());
                if (request.getSourceAttribution() != null) caseStudy.setSourceAttribution(request.getSourceAttribution());
                if (request.getCaseNarrative() != null) caseStudy.setCaseNarrative(request.getCaseNarrative());
                if (request.getCompanyBackground() != null) caseStudy.setCompanyBackground(request.getCompanyBackground());
                if (request.getIndustryContext() != null) caseStudy.setIndustryContext(request.getIndustryContext());
                if (request.getDecisionPoint() != null) caseStudy.setDecisionPoint(request.getDecisionPoint());
                if (request.getProblemStatement() != null) caseStudy.setProblemStatement(request.getProblemStatement());
                if (request.getKeyQuestions() != null) caseStudy.setKeyQuestions(request.getKeyQuestions());
                if (request.getEvaluationRubric() != null) caseStudy.setEvaluationRubric(request.getEvaluationRubric());
                if (request.getConstraints() != null) caseStudy.setConstraints(request.getConstraints());
                if (request.getExpectedOutcome() != null) caseStudy.setExpectedOutcome(request.getExpectedOutcome());
                if (request.getTeachingNotesText() != null) caseStudy.setTeachingNotesText(request.getTeachingNotesText());
                if (request.getReferenceLinks() != null) caseStudy.setReferenceLinks(request.getReferenceLinks());
                if (request.getEstimatedHours() != null) caseStudy.setEstimatedHours(request.getEstimatedHours());
                if (request.getMaxMarks() != null) caseStudy.setMaxMarks(request.getMaxMarks());
                if (request.getSubmissionType() != null) caseStudy.setSubmissionType(request.getSubmissionType());
                if (request.getGroupSubmissionEnabled() != null) {
                    caseStudy.setGroupSubmissionEnabled(request.getGroupSubmissionEnabled());
                    if (!request.getGroupSubmissionEnabled()) {
                        caseStudy.setMaxGroupSize(null);
                    }
                }
                if (request.getMaxGroupSize() != null) caseStudy.setMaxGroupSize(request.getMaxGroupSize());
                if (request.getCourseId() != null) {
                    Course course = courseRepository.findById(request.getCourseId())
                            .orElseThrow(() -> new ResourceNotFoundException("Course not found"));
                    caseStudy.setCourse(course);
                }
                if (request.getCoIds() != null) {
                    caseCoMappingRepository.deleteAllByCaseStudyId(caseId);
                    saveCaseCoMappings(caseId, request.getCoIds());
                }
                if (request.getTags() != null) {
                    caseTagRepository.deleteAllByCaseStudyId(caseId);
                    saveCaseTags(caseStudy, request.getTags());
                }
            } else if (caseStudy.getStatus() == CaseStatus.PUBLISHED) {
                if (request.getDueDate() != null) caseStudy.setDueDate(request.getDueDate().atStartOfDay());
                if (request.getMaxMarks() != null) caseStudy.setMaxMarks(request.getMaxMarks());
                if (request.getEvaluationRubric() != null) caseStudy.setEvaluationRubric(request.getEvaluationRubric());
                if (request.getReferenceLinks() != null) caseStudy.setReferenceLinks(request.getReferenceLinks());
                if (request.getEstimatedHours() != null) caseStudy.setEstimatedHours(request.getEstimatedHours());
                if (request.getTags() != null) {
                    caseTagRepository.deleteAllByCaseStudyId(caseId);
                    saveCaseTags(caseStudy, request.getTags());
                }
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
        List<CaseExhibit> exhibits = caseExhibitRepository
                .findByCaseStudyIdOrderByDisplayOrderAsc(caseId);
        for (CaseExhibit exhibit : exhibits) {
            if (exhibit.getFilePath() != null) {
                try {
                    Files.deleteIfExists(Paths.get(exhibit.getFilePath()));
                } catch (IOException ex) {
                    log.warn("Could not delete exhibit file: {}", exhibit.getFilePath());
                }
            }
        }
        caseExhibitRepository.deleteAllByCaseStudyId(caseId);
        caseTagRepository.deleteAllByCaseStudyId(caseId);
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

    private void validateCaseVisibility(CaseStudy caseStudy, Authentication auth) {
        boolean isAdmin = auth != null && auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        boolean isStudent = auth != null && auth.getAuthorities().stream()
                .anyMatch(a -> "ROLE_STUDENT".equals(a.getAuthority()));
        boolean isFaculty = auth != null && auth.getAuthorities().stream()
                .anyMatch(a -> "ROLE_FACULTY".equals(a.getAuthority()));

        if (isAdmin) {
            return;
        }

        if (isStudent && caseStudy.getStatus() != CaseStatus.PUBLISHED) {
            throw new ResourceNotFoundException("Case not found with id: " + caseStudy.getId());
        }

        if (isFaculty && caseStudy.getStatus() != CaseStatus.PUBLISHED) {
            String email = auth.getName();
            User faculty = userRepository.findByEmail(email)
                    .orElseThrow(() -> new RuntimeException("User not found"));
            boolean isOwner = caseStudy.getCreatedBy() != null
                    && caseStudy.getCreatedBy().getId().equals(faculty.getId());
            if (!isOwner) {
                throw new ResourceNotFoundException("Case not found with id: " + caseStudy.getId());
            }
        }
    }

    private CaseStudyResponse mapToResponse(CaseStudy caseStudy) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        boolean isPrivileged = auth != null && auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN")
                        || a.getAuthority().equals("ROLE_FACULTY"));

        List<CasePeerReview> completedReviews = List.of();
        try {
            completedReviews = casePeerReviewRepository.findByCaseStudyId(caseStudy.getId()).stream()
                    .filter(review -> review.getStatus() == PeerReviewStatus.COMPLETED)
                    .toList();
        } catch (Exception ex) {
            log.warn("Failed to fetch peer reviews for case {}", caseStudy.getId(), ex);
        }
        long peerReviewCount = completedReviews.size();
        Integer peerReviewRating = null;
        if (peerReviewCount > 0) {
            double avg = completedReviews.stream()
                    .map(CasePeerReview::getRating)
                    .filter(Objects::nonNull)
                    .mapToInt(Integer::intValue)
                    .average()
                    .orElse(0.0);
            peerReviewRating = (int) Math.round(avg);
        }

        List<CaseExhibitDTO> exhibitDtos = List.of();
        try {
            exhibitDtos = caseExhibitRepository
                    .findByCaseStudyIdOrderByDisplayOrderAsc(caseStudy.getId())
                    .stream()
                    .map(e -> CaseExhibitDTO.builder()
                            .id(e.getId())
                            .title(e.getTitle())
                            .description(e.getDescription())
                            .originalFileName(e.getOriginalFileName())
                            .fileType(e.getFileType())
                            .displayOrder(e.getDisplayOrder())
                            .build())
                    .toList();
        } catch (Exception ex) {
            log.warn("Failed to fetch exhibits for case {}", caseStudy.getId(), ex);
        }

        List<String> tags = List.of();
        try {
            tags = caseTagRepository.findByCaseStudyId(caseStudy.getId())
                    .stream().map(CaseTag::getTag).toList();
        } catch (Exception ex) {
            log.warn("Failed to fetch tags for case {}", caseStudy.getId(), ex);
        }

        long submissionCount = 0L;
        try {
            submissionCount = caseSubmissionRepository.countByCaseId(caseStudy.getId());
        } catch (Exception ex) {
            log.warn("Failed to fetch submission count for case {}", caseStudy.getId(), ex);
        }

        List<Long> coIds = List.of();
        try {
            coIds = caseCoMappingService.getCoIdsForCase(caseStudy.getId());
        } catch (Exception ex) {
            log.warn("Failed to fetch CO mappings for case {}", caseStudy.getId(), ex);
        }

        return CaseStudyResponse.builder()
                .id(caseStudy.getId())
                .title(caseStudy.getTitle())
                .description(caseStudy.getDescription())
                .difficulty(caseStudy.getDifficulty())
                .status(caseStudy.getStatus())
                .courseId(caseStudy.getCourse() != null ? caseStudy.getCourse().getId() : null)
                .createdBy(caseStudy.getCreatedBy() != null ? caseStudy.getCreatedBy().getId() : null)
                .dueDate(caseStudy.getDueDate())
                .maxMarks(caseStudy.getMaxMarks())
                .category(caseStudy.getCategory())
                .submissionType(caseStudy.getSubmissionType())
                .groupSubmissionEnabled(caseStudy.isGroupSubmissionEnabled())
                .maxGroupSize(caseStudy.getMaxGroupSize())
                .caseMaterialPath(caseStudy.getCaseMaterialPath())
                .caseDocumentOriginalName(caseStudy.getCaseDocumentOriginalName())
                .hasDocument(caseStudy.getCaseDocumentPath() != null && !caseStudy.getCaseDocumentPath().isBlank())
                .companyName(caseStudy.getCompanyName())
                .realCompanyName(caseStudy.getRealCompanyName())
                .isDisguised(caseStudy.isDisguised())
                .industry(caseStudy.getIndustry())
                .geographicRegion(caseStudy.getGeographicRegion())
                .protagonistRole(caseStudy.getProtagonistRole())
                .publicationYear(caseStudy.getPublicationYear())
                .sourceAttribution(caseStudy.getSourceAttribution())
                .caseNarrative(caseStudy.getCaseNarrative())
                .companyBackground(caseStudy.getCompanyBackground())
                .industryContext(caseStudy.getIndustryContext())
                .decisionPoint(caseStudy.getDecisionPoint())
                .problemStatement(caseStudy.getProblemStatement())
                .keyQuestions(caseStudy.getKeyQuestions())
                .evaluationRubric(caseStudy.getEvaluationRubric())
                .constraints(caseStudy.getConstraints())
                .referenceLinks(caseStudy.getReferenceLinks())
                .estimatedHours(caseStudy.getEstimatedHours())
                .teachingNotesText(isPrivileged ? caseStudy.getTeachingNotesText() : null)
                .teachingNotesOriginalName(isPrivileged ? caseStudy.getTeachingNotesOriginalName() : null)
                .hasTeachingNotes(isPrivileged && (
                        (caseStudy.getTeachingNotesPath() != null && !caseStudy.getTeachingNotesPath().isBlank())
                                || (caseStudy.getTeachingNotesText() != null && !caseStudy.getTeachingNotesText().isBlank())
                ))
                .exhibits(exhibitDtos)
                .tags(tags)
                .submissionCount(submissionCount)
                .peerReviewRating(peerReviewRating)
                .peerReviewCount(peerReviewCount)
                .coIds(coIds)
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

    private void saveCaseTags(CaseStudy caseStudy, List<String> tags) {
        if (tags == null || tags.isEmpty()) return;
        tags.stream()
                .filter(t -> t != null && !t.isBlank())
                .map(String::trim)
                .map(String::toLowerCase)
                .filter(tag -> tag.length() <= 30)
                .distinct()
                .limit(10)
                .forEach(tag -> caseTagRepository.save(
                        CaseTag.builder().caseStudy(caseStudy).tag(tag).build()
                ));
    }

    private CaseCategory parseCategoryOrThrow(String categoryValue) {
        try {
            return CaseCategory.valueOf(categoryValue.trim().toUpperCase());
        } catch (Exception ex) {
            throw new IllegalArgumentException("Invalid category: " + categoryValue);
        }
    }

    private CaseCategory parseCategory(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        try {
            return CaseCategory.valueOf(value.trim().toUpperCase());
        } catch (IllegalArgumentException ex) {
            return null;
        }
    }

    private DifficultyLevel parseDifficulty(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        try {
            return DifficultyLevel.valueOf(value.trim().toUpperCase());
        } catch (IllegalArgumentException ex) {
            return null;
        }
    }

    private CaseCategory parseCategoryEnum(CaseCategory category) {
        if (category == null) {
            return CaseCategory.PRODUCT;
        }
        try {
            return CaseCategory.valueOf(category.name());
        } catch (IllegalArgumentException ex) {
            throw new IllegalArgumentException(
                    "Invalid category value: " + category
                            + ". Must be one of: " + Arrays.toString(CaseCategory.values())
            );
        }
    }
}
