package com.icr.backend.casestudy.dto;

import com.icr.backend.casestudy.enums.DifficultyLevel;
import com.icr.backend.enums.CaseStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

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
    private DifficultyLevel difficulty;
    private LocalDate dueDate;
    private CaseStatus status;
    private Integer maxMarks;
    private Long courseId;
}
