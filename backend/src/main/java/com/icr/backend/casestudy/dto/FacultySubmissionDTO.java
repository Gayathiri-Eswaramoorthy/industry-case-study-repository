package com.icr.backend.casestudy.dto;

import com.icr.backend.casestudy.enums.SubmissionStatus;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class FacultySubmissionDTO {

    private Long submissionId;
    private Long caseId;
    private Long courseId;
    private String studentName;
    private String caseTitle;
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
    private LocalDateTime submittedAt;
    private SubmissionStatus status;

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
