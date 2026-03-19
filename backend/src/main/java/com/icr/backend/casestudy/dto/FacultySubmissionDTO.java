package com.icr.backend.casestudy.dto;

import com.icr.backend.casestudy.enums.SubmissionStatus;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
public class FacultySubmissionDTO {

    private Long submissionId;
    private Long caseId;
    private Long courseId;
    private String studentName;
    private String caseTitle;
    private String createdByName;
    private String solutionText;
    private String executiveSummary;
    private String situationAnalysis;
    private String rootCauseAnalysis;
    private String proposedSolution;
    private String implementationPlan;
    private String risksAndConstraints;
    private String conclusion;
    private String reevalReason;
    private String githubLink;
    private String pdfFileName;
    private String pdfFilePath;
    private Integer selfRating;
    private Integer marksAwarded;
    private String facultyFeedback;
    private LocalDateTime submittedAt;
    private SubmissionStatus status;
    private boolean canEvaluate;

    // Keep ONLY this constructor — used by the original findFacultySubmissions JPQL
    public FacultySubmissionDTO(
            Long submissionId,
            String studentName,
            String caseTitle,
            LocalDateTime submittedAt,
            SubmissionStatus status
    ) {
        this.submissionId = submissionId;
        this.studentName = studentName;
        this.caseTitle = caseTitle;
        this.submittedAt = submittedAt;
        this.status = status;
    }
}
