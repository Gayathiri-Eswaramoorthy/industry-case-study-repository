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

    public FacultySubmissionDTO(
            Long submissionId,
            Long caseId,
            Long courseId,
            String studentName,
            String caseTitle,
            String solutionText,
            String executiveSummary,
            String situationAnalysis,
            String rootCauseAnalysis,
            String proposedSolution,
            String implementationPlan,
            String risksAndConstraints,
            String conclusion,
            String githubLink,
            String pdfFileName,
            String pdfFilePath,
            Integer selfRating,
            Integer marksAwarded,
            String facultyFeedback,
            LocalDateTime submittedAt,
            SubmissionStatus status
    ) {
        this.submissionId = submissionId;
        this.caseId = caseId;
        this.courseId = courseId;
        this.studentName = studentName;
        this.caseTitle = caseTitle;
        this.solutionText = solutionText;
        this.executiveSummary = executiveSummary;
        this.situationAnalysis = situationAnalysis;
        this.rootCauseAnalysis = rootCauseAnalysis;
        this.proposedSolution = proposedSolution;
        this.implementationPlan = implementationPlan;
        this.risksAndConstraints = risksAndConstraints;
        this.conclusion = conclusion;
        this.githubLink = githubLink;
        this.pdfFileName = pdfFileName;
        this.pdfFilePath = pdfFilePath;
        this.selfRating = selfRating;
        this.marksAwarded = marksAwarded;
        this.facultyFeedback = facultyFeedback;
        this.submittedAt = submittedAt;
        this.status = status;
    }
}
