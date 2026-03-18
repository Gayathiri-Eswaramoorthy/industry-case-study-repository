package com.icr.backend.service.impl;

import com.icr.backend.casestudy.enums.SubmissionStatus;
import com.icr.backend.casestudy.repository.CaseSubmissionRepository;
import com.icr.backend.casestudy.repository.CaseStudyRepository;
import com.icr.backend.enums.CaseStatus;
import com.icr.backend.enums.RoleType;
import com.icr.backend.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AnalyticsServiceImplTest {

    @Mock
    private UserRepository userRepository;
    @Mock
    private CaseStudyRepository caseStudyRepository;
    @Mock
    private CaseSubmissionRepository caseSubmissionRepository;

    @InjectMocks
    private AnalyticsServiceImpl analyticsService;

    @Test
    void getUserAnalytics_returnsCorrectCounts() {
        // Arrange
        when(userRepository.count()).thenReturn(20L);
        when(userRepository.countByRole_Name(RoleType.FACULTY)).thenReturn(4L);
        when(userRepository.countByRole_Name(RoleType.STUDENT)).thenReturn(14L);
        when(userRepository.countByRole_Name(RoleType.ADMIN)).thenReturn(2L);

        // Act
        Map<String, Long> result = analyticsService.getUserAnalytics();

        // Assert
        assertEquals(20L, result.get("totalUsers"));
        assertEquals(4L, result.get("activeFaculty"));
        assertEquals(14L, result.get("students"));
        assertEquals(2L, result.get("admins"));
    }

    @Test
    void getCaseAnalytics_returnsCorrectCountsPerStatus() {
        // Arrange
        when(caseStudyRepository.count()).thenReturn(12L);
        when(caseStudyRepository.countByStatus(CaseStatus.DRAFT)).thenReturn(3L);
        when(caseStudyRepository.countByStatus(CaseStatus.PUBLISHED)).thenReturn(7L);
        when(caseStudyRepository.countByStatus(CaseStatus.SUBMISSION_OPEN)).thenReturn(2L);

        // Act
        Map<String, Long> result = analyticsService.getCaseAnalytics();

        // Assert
        assertEquals(12L, result.get("totalCases"));
        assertEquals(3L, result.get("draftCases"));
        assertEquals(7L, result.get("publishedCases"));
        assertEquals(2L, result.get("submissionOpenCases"));
    }

    @Test
    void getSubmissionAnalytics_returnsCorrectCountsPerStatus() {
        // Arrange
        when(caseSubmissionRepository.count()).thenReturn(30L);
        when(caseSubmissionRepository.countByStatus(SubmissionStatus.SUBMITTED)).thenReturn(10L);
        when(caseSubmissionRepository.countByStatus(SubmissionStatus.UNDER_REVIEW)).thenReturn(8L);
        when(caseSubmissionRepository.countByStatus(SubmissionStatus.EVALUATED)).thenReturn(12L);

        // Act
        Map<String, Long> result = analyticsService.getSubmissionAnalytics();

        // Assert
        assertEquals(30L, result.get("totalSubmissions"));
        assertEquals(10L, result.get("submitted"));
        assertEquals(8L, result.get("underReview"));
        assertEquals(12L, result.get("evaluated"));
    }
}
