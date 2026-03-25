package com.icr.backend.casestudy.controller;

import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.icr.backend.casestudy.dto.CaseStudyRequest;
import com.icr.backend.casestudy.dto.CaseStudyResponse;
import com.icr.backend.casestudy.enums.CaseCategory;
import com.icr.backend.casestudy.enums.DifficultyLevel;
import com.icr.backend.casestudy.enums.SubmissionType;
import com.icr.backend.exception.GlobalExceptionHandler;
import com.icr.backend.exception.ResourceNotFoundException;
import com.icr.backend.security.JwtAuthenticationFilter;
import com.icr.backend.casestudy.repository.CaseExhibitRepository;
import com.icr.backend.casestudy.repository.CaseStudyRepository;
import com.icr.backend.casestudy.repository.CaseTagRepository;
import com.icr.backend.casestudy.service.CaseStudyService;
import com.icr.backend.repository.UserRepository;
import org.springframework.cache.CacheManager;
import org.springframework.data.jpa.mapping.JpaMetamodelMappingContext;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.BeforeEach;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Import;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(CaseStudyController.class)
@AutoConfigureMockMvc(addFilters = false)
@Import(GlobalExceptionHandler.class)
class CaseStudyControllerTest {

    @Autowired
    private MockMvc mockMvc;

    private ObjectMapper objectMapper;

    @MockitoBean
    private CaseStudyService caseStudyService;

    @MockitoBean
    private CaseStudyRepository caseStudyRepository;

    @MockitoBean
    private CaseExhibitRepository caseExhibitRepository;

    @MockitoBean
    private CaseTagRepository caseTagRepository;

    @MockitoBean
    private UserRepository userRepository;

    @MockitoBean
    private JwtAuthenticationFilter jwtAuthenticationFilter;

    @MockitoBean
    private JpaMetamodelMappingContext jpaMetamodelMappingContext;

    @MockitoBean
    private CacheManager cacheManager;

    @BeforeEach
    void setUp() {
        objectMapper = new ObjectMapper();
        objectMapper.registerModule(new JavaTimeModule());
    }

    @Test
    @WithMockUser(roles = "STUDENT")
    void getAllCases_returns200WithList() throws Exception {
        // Arrange
        CaseStudyResponse response = CaseStudyResponse.builder()
                .id(1L)
                .title("Case One")
                .description("Description")
                .build();
        when(caseStudyService.getAllCases(any(PageRequest.class)))
                .thenReturn(new PageImpl<>(List.of(response), PageRequest.of(0, 10), 1));

        // Act & Assert
        mockMvc.perform(get("/api/cases"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content[0].title").value("Case One"));
    }

    @Test
    @WithMockUser(roles = "FACULTY")
    void postCreateCase_returnsCreatedCaseWhenValidRequestBody() throws Exception {
        // Arrange
        CaseStudyRequest request = CaseStudyRequest.builder()
                .title("Valid Title")
                .description("Valid Description")
                .difficulty(DifficultyLevel.MEDIUM)
                .category(CaseCategory.PRODUCT)
                .submissionType(SubmissionType.TEXT)
                .courseId(1L)
                .dueDate(LocalDateTime.now().plusDays(1))
                .maxMarks(100)
                .build();
        CaseStudyResponse response = CaseStudyResponse.builder()
                .id(5L)
                .title("Valid Title")
                .description("Valid Description")
                .build();
        when(caseStudyService.createCase(any(CaseStudyRequest.class))).thenReturn(response);

        // Act & Assert
        mockMvc.perform(post("/api/cases")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title").value("Valid Title"));
    }

    @Test
    @WithMockUser(roles = "FACULTY")
    void postCreateCase_returns400WhenTitleIsBlank() throws Exception {
        // Arrange
        CaseStudyRequest request = CaseStudyRequest.builder()
                .title(" ")
                .description("Valid Description")
                .difficulty(DifficultyLevel.MEDIUM)
                .category(CaseCategory.PRODUCT)
                .submissionType(SubmissionType.TEXT)
                .courseId(1L)
                .dueDate(LocalDateTime.now().plusDays(1))
                .maxMarks(100)
                .build();

        // Act & Assert
        mockMvc.perform(post("/api/cases")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Title is required"));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void deleteCase_returns404WhenCaseNotFound() throws Exception {
        // Arrange
        doThrow(new ResourceNotFoundException("Case not found with id: 999"))
                .when(caseStudyService)
                .deleteCase(999L);

        // Act & Assert
        mockMvc.perform(delete("/api/cases/{id}", 999L).with(csrf()))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message").value("Case not found with id: 999"));
    }
}
