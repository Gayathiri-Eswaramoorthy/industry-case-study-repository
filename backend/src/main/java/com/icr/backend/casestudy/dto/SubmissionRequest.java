package com.icr.backend.casestudy.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SubmissionRequest {

    private Long caseId;
    private String solutionText;
    private String executiveSummary;
    private String situationAnalysis;
    private String rootCauseAnalysis;
    private String proposedSolution;
    private String implementationPlan;
    private String risksAndConstraints;
    private String conclusion;
    private String githubLink;
    private String pdfFileName;
    private String pdfFilePath;
    private Integer selfRating;
}
