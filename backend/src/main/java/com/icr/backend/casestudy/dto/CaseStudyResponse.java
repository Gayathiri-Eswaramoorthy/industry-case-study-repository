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
    private String caseMaterialPath;
    private String problemStatement;
    private String keyQuestions;
    private String evaluationRubric;
    private String constraints;
    // expectedOutcome is intentionally excluded so it is never exposed in student-facing responses.
    private String referenceLinks;
    private Integer estimatedHours;
    private List<Long> coIds;
    private LocalDateTime createdAt;
}
