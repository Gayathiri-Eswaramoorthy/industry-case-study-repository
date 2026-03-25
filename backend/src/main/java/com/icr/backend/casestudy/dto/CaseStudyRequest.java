package com.icr.backend.casestudy.dto;

import com.icr.backend.casestudy.enums.DifficultyLevel;
import com.icr.backend.casestudy.enums.CaseCategory;
import com.icr.backend.casestudy.enums.SubmissionType;
import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.*;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CaseStudyRequest {

    @NotBlank(message = "Title is required")
    @Size(max = 200)
    private String title;

    @NotBlank(message = "Description is required")
    @Size(max = 2000)
    private String description;

    @NotNull(message = "Difficulty is required")
    private DifficultyLevel difficulty;

    @NotNull(message = "Course is required")
    private Long courseId;

    @Future(message = "Due date must be in the future")
    private LocalDateTime dueDate;

    private Integer maxMarks;

    @NotNull(message = "Category is required")
    private CaseCategory category;

    @NotNull(message = "Submission type is required")
    private SubmissionType submissionType;
    private String caseMaterialPath;
    private String companyName;
    private String realCompanyName;
    private boolean isDisguised;
    private String industry;
    private String geographicRegion;
    private String protagonistRole;
    private Integer publicationYear;
    private String sourceAttribution;
    private String caseNarrative;
    private String companyBackground;
    private String industryContext;
    private String decisionPoint;
    private String problemStatement;
    private String keyQuestions;
    private String evaluationRubric;
    private String constraints;
    private String expectedOutcome;
    private String teachingNotesText;
    private String referenceLinks;
    private Integer estimatedHours;
    private boolean groupSubmissionEnabled;
    private Integer maxGroupSize;
    private List<String> tags;
    private List<Long> coIds;
}
