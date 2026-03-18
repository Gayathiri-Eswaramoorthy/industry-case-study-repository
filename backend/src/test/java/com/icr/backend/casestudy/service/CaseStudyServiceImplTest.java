package com.icr.backend.casestudy.service;

import com.icr.backend.casestudy.dto.CaseStudyRequest;
import com.icr.backend.casestudy.dto.CaseStudyResponse;
import com.icr.backend.casestudy.entity.CaseStudy;
import com.icr.backend.casestudy.enums.CaseCategory;
import com.icr.backend.casestudy.enums.DifficultyLevel;
import com.icr.backend.casestudy.enums.SubmissionType;
import com.icr.backend.casestudy.repository.CaseCoMappingRepository;
import com.icr.backend.casestudy.repository.CaseStudyRepository;
import com.icr.backend.course.entity.Course;
import com.icr.backend.course.repository.CourseRepository;
import com.icr.backend.entity.Role;
import com.icr.backend.entity.User;
import com.icr.backend.enums.CaseStatus;
import com.icr.backend.enums.RoleType;
import com.icr.backend.exception.ResourceNotFoundException;
import com.icr.backend.repository.UserRepository;
import com.icr.backend.service.ActivityService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CaseStudyServiceImplTest {

    @Mock
    private CaseStudyRepository caseStudyRepository;
    @Mock
    private CourseRepository courseRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private ActivityService activityService;
    @Mock
    private CaseCoMappingService caseCoMappingService;
    @Mock
    private CaseCoMappingRepository caseCoMappingRepository;

    @InjectMocks
    private CaseStudyServiceImpl caseStudyService;

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void createCase_savesAndReturnsResponse() {
        // Arrange
        Course course = Course.builder().id(1L).courseCode("CS101").courseName("Course").build();
        User user = User.builder()
                .id(2L)
                .email("faculty@test.com")
                .role(Role.builder().name(RoleType.FACULTY).build())
                .build();
        CaseStudyRequest request = CaseStudyRequest.builder()
                .title("Case Title")
                .description("Case Description")
                .difficulty(DifficultyLevel.MEDIUM)
                .category(CaseCategory.PRODUCT)
                .submissionType(SubmissionType.TEXT)
                .courseId(1L)
                .dueDate(LocalDateTime.now().plusDays(5))
                .maxMarks(100)
                .coIds(List.of(10L, 11L))
                .build();
        CaseStudy savedCase = CaseStudy.builder()
                .id(5L)
                .title(request.getTitle())
                .description(request.getDescription())
                .difficulty(request.getDifficulty())
                .status(CaseStatus.DRAFT)
                .course(course)
                .createdBy(user)
                .category(request.getCategory())
                .submissionType(request.getSubmissionType())
                .dueDate(request.getDueDate())
                .maxMarks(request.getMaxMarks())
                .createdAt(LocalDateTime.now())
                .build();

        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken("faculty@test.com", "password", List.of())
        );
        when(courseRepository.findById(1L)).thenReturn(Optional.of(course));
        when(userRepository.findByEmail("faculty@test.com")).thenReturn(Optional.of(user));
        when(caseStudyRepository.save(any(CaseStudy.class))).thenReturn(savedCase);
        when(caseCoMappingService.getCoIdsForCase(5L)).thenReturn(List.of(10L, 11L));

        // Act
        CaseStudyResponse response = caseStudyService.createCase(request);

        // Assert
        assertNotNull(response);
        assertEquals("Case Title", response.getTitle());
        assertEquals(1L, response.getCourseId());
        assertEquals(List.of(10L, 11L), response.getCoIds());
        verify(caseCoMappingService).mapCaseToCo(5L, 10L);
        verify(caseCoMappingService).mapCaseToCo(5L, 11L);
        verify(caseStudyRepository).save(any(CaseStudy.class));
    }

    @Test
    void createCase_throwsIllegalArgumentExceptionWhenCourseIdNotFound() {
        // Arrange
        CaseStudyRequest request = CaseStudyRequest.builder()
                .courseId(999L)
                .build();
        when(courseRepository.findById(999L)).thenReturn(Optional.empty());

        // Act
        IllegalArgumentException exception = assertThrows(
                IllegalArgumentException.class,
                () -> caseStudyService.createCase(request)
        );

        // Assert
        assertEquals("Course not found", exception.getMessage());
        verify(caseStudyRepository, never()).save(any(CaseStudy.class));
    }

    @Test
    void getCaseById_returnsResponseWhenCaseExists() {
        // Arrange
        Course course = Course.builder().id(1L).courseCode("CS101").courseName("Course").build();
        User user = User.builder()
                .id(2L)
                .email("admin@test.com")
                .role(Role.builder().name(RoleType.ADMIN).build())
                .build();
        CaseStudy caseStudy = CaseStudy.builder()
                .id(3L)
                .title("Existing Case")
                .description("Description")
                .difficulty(DifficultyLevel.EASY)
                .status(CaseStatus.DRAFT)
                .category(CaseCategory.PRODUCT)
                .submissionType(SubmissionType.TEXT)
                .course(course)
                .createdBy(user)
                .createdAt(LocalDateTime.now())
                .build();

        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(
                        "admin@test.com",
                        "password",
                        List.of(() -> "ROLE_ADMIN")
                )
        );
        when(caseStudyRepository.findById(3L)).thenReturn(Optional.of(caseStudy));
        when(caseCoMappingService.getCoIdsForCase(3L)).thenReturn(List.of());

        // Act
        CaseStudyResponse response = caseStudyService.getCaseById(3L);

        // Assert
        assertNotNull(response);
        assertEquals(3L, response.getId());
        assertEquals("Existing Case", response.getTitle());
    }

    @Test
    void getCaseById_throwsResourceNotFoundExceptionWhenCaseNotFound() {
        // Arrange
        when(caseStudyRepository.findById(99L)).thenReturn(Optional.empty());

        // Act
        ResourceNotFoundException exception = assertThrows(
                ResourceNotFoundException.class,
                () -> caseStudyService.getCaseById(99L)
        );

        // Assert
        assertEquals("Case not found with id: 99", exception.getMessage());
    }

    @Test
    void deleteCase_deletesWhenCaseExists() {
        // Arrange
        CaseStudy caseStudy = CaseStudy.builder().id(7L).build();
        when(caseStudyRepository.findById(7L)).thenReturn(Optional.of(caseStudy));

        // Act
        caseStudyService.deleteCase(7L);

        // Assert
        verify(caseCoMappingRepository).deleteAllByCaseStudyId(7L);
        verify(caseStudyRepository).delete(caseStudy);
    }

    @Test
    void deleteCase_throwsResourceNotFoundExceptionWhenCaseNotFound() {
        // Arrange
        when(caseStudyRepository.findById(404L)).thenReturn(Optional.empty());

        // Act
        ResourceNotFoundException exception = assertThrows(
                ResourceNotFoundException.class,
                () -> caseStudyService.deleteCase(404L)
        );

        // Assert
        assertEquals("Case not found with id: 404", exception.getMessage());
        verify(caseStudyRepository, never()).delete(any(CaseStudy.class));
    }
}
