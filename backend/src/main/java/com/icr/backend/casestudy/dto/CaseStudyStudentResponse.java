package com.icr.backend.casestudy.dto;

import com.icr.backend.casestudy.enums.CaseCategory;
import com.icr.backend.casestudy.enums.DifficultyLevel;
import com.icr.backend.casestudy.enums.SubmissionType;
import com.icr.backend.enums.CaseStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CaseStudyStudentResponse {

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
    private List<CaseExhibitDTO> exhibits;
    private String problemStatement;
    private String keyQuestions;
    private List<DiscussionQuestionDTO> discussionQuestions;
    private String evaluationRubric;
    private String constraints;
    private String referenceLinks;
    private Integer estimatedHours;
    private List<Long> coIds;
    private List<String> tags;
    private Long submissionCount;
    private Integer peerReviewRating;
    private Long peerReviewCount;
    private LocalDateTime createdAt;
}
