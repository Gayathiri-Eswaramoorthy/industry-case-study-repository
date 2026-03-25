package com.icr.backend.casestudy.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.icr.backend.casestudy.enums.DifficultyLevel;
import com.icr.backend.casestudy.enums.SubmissionType;
import com.icr.backend.enums.CaseStatus;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;
import lombok.*;

import java.time.LocalDate;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UpdateCaseStudyRequest {

    @Size(max = 200)
    private String title;

    @Size(max = 2000)
    private String description;
    private String category;
    private SubmissionType submissionType;
    private DifficultyLevel difficulty;

    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate dueDate;

    private CaseStatus status;

    @Min(value = 1, message = "Max marks must be at least 1")
    private Integer maxMarks;
    private Long courseId;
    private List<Long> coIds;
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
    private Boolean groupSubmissionEnabled;
    private Integer maxGroupSize;
    private List<String> tags;
}
