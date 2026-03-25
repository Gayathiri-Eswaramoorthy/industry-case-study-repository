package com.icr.backend.casestudy.dto;

import com.icr.backend.casestudy.enums.DifficultyLevel;
import com.icr.backend.casestudy.enums.CaseCategory;
import com.icr.backend.casestudy.enums.SubmissionType;
import com.icr.backend.enums.CaseStatus;
import lombok.*;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CaseStudyResponse {

    private Long id;
    private String title;
    private String description;
    private DifficultyLevel difficulty;
    private CaseStatus status;
    private Long courseId;
    private Long createdBy;
    private LocalDateTime dueDate;
    private Integer maxMarks;
    private CaseCategory category;
    private SubmissionType submissionType;
    private boolean groupSubmissionEnabled;
    private Integer maxGroupSize;
    private String caseMaterialPath;
    private String caseDocumentOriginalName;
    private boolean hasDocument;
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
    // expectedOutcome is intentionally excluded so it is never exposed in student-facing responses.
    private String referenceLinks;
    private Integer estimatedHours;
    private String teachingNotesText;
    private String teachingNotesOriginalName;
    private boolean hasTeachingNotes;
    private List<CaseExhibitDTO> exhibits;
    private List<String> tags;
    private Long submissionCount;
    private Integer peerReviewRating;
    private Long peerReviewCount;
    private List<Long> coIds;
    private LocalDateTime createdAt;
}
