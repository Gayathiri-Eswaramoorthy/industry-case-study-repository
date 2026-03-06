package com.icr.backend.casestudy.dto;

import com.icr.backend.casestudy.enums.DifficultyLevel;
import com.icr.backend.casestudy.enums.CaseCategory;
import com.icr.backend.casestudy.enums.SubmissionType;
import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CaseStudyRequest {

    private String title;
    private String description;
    private DifficultyLevel difficulty;
    private Long courseId;
    private LocalDateTime dueDate;
    private Integer maxMarks;
    private CaseCategory category;
    private SubmissionType submissionType;
    private String caseMaterialPath;
}
