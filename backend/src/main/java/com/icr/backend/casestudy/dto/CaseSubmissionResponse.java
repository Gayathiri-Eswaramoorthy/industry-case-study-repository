package com.icr.backend.casestudy.dto;

import com.icr.backend.casestudy.enums.SubmissionStatus;
import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CaseSubmissionResponse {

    private Long id;
    private Long caseId;
    private Long studentId;
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
    private Integer marksAwarded;
    private String facultyFeedback;
    private SubmissionStatus status;
    private LocalDateTime submittedAt;
    private LocalDateTime evaluatedAt;
}
