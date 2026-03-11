package com.icr.backend.casestudy.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.icr.backend.casestudy.enums.DifficultyLevel;
import com.icr.backend.enums.CaseStatus;
import lombok.*;

import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UpdateCaseStudyRequest {

    private String title;
    private String description;
    private String category;
    private String submissionType;
    private DifficultyLevel difficulty;

    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate dueDate;

    private CaseStatus status;
    private Integer maxMarks;
    private Long courseId;
}
