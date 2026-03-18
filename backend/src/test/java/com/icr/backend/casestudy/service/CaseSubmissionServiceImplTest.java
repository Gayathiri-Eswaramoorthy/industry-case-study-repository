package com.icr.backend.casestudy.service;

import com.icr.backend.casestudy.dto.CaseSubmissionResponse;
import com.icr.backend.casestudy.dto.SubmissionEvaluationRequest;
import com.icr.backend.casestudy.dto.SubmissionRequest;
import com.icr.backend.casestudy.entity.CaseStudy;
import com.icr.backend.casestudy.entity.CaseSubmission;
import com.icr.backend.casestudy.repository.CaseStudyRepository;
import com.icr.backend.casestudy.repository.CaseSubmissionRepository;
import com.icr.backend.casestudy.repository.SubmissionCoScoreRepository;
import com.icr.backend.casestudy.enums.SubmissionStatus;
import com.icr.backend.casestudy.enums.SubmissionType;
import com.icr.backend.entity.Role;
import com.icr.backend.entity.User;
import com.icr.backend.enums.CaseStatus;
import com.icr.backend.enums.RoleType;
import com.icr.backend.exception.DuplicateSubmissionException;
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
class CaseSubmissionServiceImplTest {

    @Mock
    private CaseSubmissionRepository caseSubmissionRepository;
    @Mock
    private CaseStudyRepository caseStudyRepository;
    @Mock
    private SubmissionCoScoreRepository submissionCoScoreRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private ActivityService activityService;

    @InjectMocks
    private CaseSubmissionServiceImpl caseSubmissionService;

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void submitSolution_createsSubmissionSuccessfully() {
        // Arrange
        User student = User.builder()
                .id(1L)
                .email("student@test.com")
                .role(Role.builder().name(RoleType.STUDENT).build())
                .build();
        CaseStudy caseStudy = CaseStudy.builder()
                .id(2L)
                .status(CaseStatus.PUBLISHED)
                .submissionType(SubmissionType.TEXT)
                .build();
        CaseSubmission savedSubmission = CaseSubmission.builder()
                .id(10L)
                .caseId(2L)
                .studentId(1L)
                .solutionText("My answer")
                .status(SubmissionStatus.SUBMITTED)
                .submittedAt(LocalDateTime.now())
                .build();
        SubmissionRequest request = SubmissionRequest.builder()
                .caseId(2L)
                .solutionText("My answer")
                .selfRating(4)
                .build();

        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken("student@test.com", "password", List.of())
        );
        when(userRepository.findByEmail("student@test.com")).thenReturn(Optional.of(student));
        when(caseStudyRepository.findById(2L)).thenReturn(Optional.of(caseStudy));
        when(caseSubmissionRepository.findByCaseIdAndStudentId(2L, 1L)).thenReturn(Optional.empty());
        when(caseSubmissionRepository.save(any(CaseSubmission.class))).thenReturn(savedSubmission);

        // Act
        CaseSubmissionResponse response = caseSubmissionService.submitSolution(request, null);

        // Assert
        assertNotNull(response);
        assertEquals(SubmissionStatus.SUBMITTED, response.getStatus());
        assertEquals("My answer", response.getSolutionText());
        verify(caseSubmissionRepository).save(any(CaseSubmission.class));
        verify(activityService, times(2)).logEvent(eq(1L), eq(2L), any());
    }

    @Test
    void submitSolution_throwsDuplicateSubmissionExceptionWhenAlreadySubmitted() {
        // Arrange
        User student = User.builder().id(1L).email("student@test.com").build();
        CaseStudy caseStudy = CaseStudy.builder()
                .id(2L)
                .status(CaseStatus.PUBLISHED)
                .submissionType(SubmissionType.TEXT)
                .build();
        SubmissionRequest request = SubmissionRequest.builder()
                .caseId(2L)
                .solutionText("Duplicate answer")
                .build();

        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken("student@test.com", "password", List.of())
        );
        when(userRepository.findByEmail("student@test.com")).thenReturn(Optional.of(student));
        when(caseStudyRepository.findById(2L)).thenReturn(Optional.of(caseStudy));
        when(caseSubmissionRepository.findByCaseIdAndStudentId(2L, 1L))
                .thenReturn(Optional.of(CaseSubmission.builder().id(99L).build()));

        // Act
        DuplicateSubmissionException exception = assertThrows(
                DuplicateSubmissionException.class,
                () -> caseSubmissionService.submitSolution(request, null)
        );

        // Assert
        assertEquals("You have already submitted this case", exception.getMessage());
        verify(caseSubmissionRepository, never()).save(any(CaseSubmission.class));
    }

    @Test
    void submitSolution_throwsIllegalArgumentExceptionWhenCaseIsNotPublished() {
        // Arrange
        User student = User.builder().id(1L).email("student@test.com").build();
        CaseStudy caseStudy = CaseStudy.builder()
                .id(2L)
                .status(CaseStatus.DRAFT)
                .submissionType(SubmissionType.TEXT)
                .build();
        SubmissionRequest request = SubmissionRequest.builder()
                .caseId(2L)
                .solutionText("Attempt")
                .build();

        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken("student@test.com", "password", List.of())
        );
        when(userRepository.findByEmail("student@test.com")).thenReturn(Optional.of(student));
        when(caseStudyRepository.findById(2L)).thenReturn(Optional.of(caseStudy));

        // Act
        IllegalArgumentException exception = assertThrows(
                IllegalArgumentException.class,
                () -> caseSubmissionService.submitSolution(request, null)
        );

        // Assert
        assertEquals("Submissions are allowed only for published case studies", exception.getMessage());
    }

    @Test
    void evaluateSubmission_updatesStatusToEvaluated() {
        // Arrange
        User faculty = User.builder()
                .id(5L)
                .email("faculty@test.com")
                .role(Role.builder().name(RoleType.FACULTY).build())
                .build();
        CaseStudy caseStudy = CaseStudy.builder().id(20L).build();
        CaseSubmission submission = CaseSubmission.builder()
                .id(30L)
                .caseId(20L)
                .studentId(11L)
                .status(SubmissionStatus.UNDER_REVIEW)
                .build();
        SubmissionEvaluationRequest request = SubmissionEvaluationRequest.builder()
                .score(85)
                .feedback("Strong work")
                .build();

        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken("faculty@test.com", "password", List.of())
        );
        when(userRepository.findByEmail("faculty@test.com")).thenReturn(Optional.of(faculty));
        when(caseStudyRepository.findByCreatedBy_Id(5L)).thenReturn(List.of(caseStudy));
        when(caseSubmissionRepository.findByIdAndCaseIdIn(30L, List.of(20L))).thenReturn(Optional.of(submission));
        when(caseSubmissionRepository.save(any(CaseSubmission.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // Act
        CaseSubmissionResponse response = caseSubmissionService.evaluateSubmission(30L, request);

        // Assert
        assertNotNull(response);
        assertEquals(SubmissionStatus.EVALUATED, response.getStatus());
        assertEquals(85, response.getMarksAwarded());
        assertEquals("Strong work", response.getFacultyFeedback());
        verify(caseSubmissionRepository).save(any(CaseSubmission.class));
    }

    @Test
    void evaluateSubmission_throwsIllegalArgumentExceptionWhenScoreIsNull() {
        // Arrange
        SubmissionEvaluationRequest request = SubmissionEvaluationRequest.builder()
                .score(null)
                .feedback("No score")
                .build();

        // Act
        IllegalArgumentException exception = assertThrows(
                IllegalArgumentException.class,
                () -> caseSubmissionService.evaluateSubmission(1L, request)
        );

        // Assert
        assertEquals("Score is required", exception.getMessage());
        verify(caseSubmissionRepository, never()).save(any(CaseSubmission.class));
    }
}
