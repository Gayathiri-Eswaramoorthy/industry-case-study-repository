package com.icr.backend.casestudy.entity;

import com.icr.backend.casestudy.enums.SubmissionStatus;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "case_submissions",
        uniqueConstraints = {
                @UniqueConstraint(columnNames = {"case_id", "student_id"})
        })
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CaseSubmission {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "case_id", nullable = false)
    private Long caseId;

    @Column(name = "student_id", nullable = false)
    private Long studentId;

    @Column(name = "group_id")
    private Long groupId;

    @Column(name = "evaluating_faculty_id")
    private Long evaluatingFacultyId;

    @Column(name = "evaluated_by_faculty_id")
    private Long evaluatedByFacultyId;

    @Column(columnDefinition = "TEXT", nullable = true)
    private String solutionText;

    @Column(columnDefinition = "TEXT", nullable = true)
    private String executiveSummary;

    @Column(columnDefinition = "TEXT", nullable = true)
    private String situationAnalysis;

    @Column(columnDefinition = "TEXT", nullable = true)
    private String rootCauseAnalysis;

    @Column(columnDefinition = "TEXT", nullable = true)
    private String proposedSolution;

    @Column(columnDefinition = "TEXT", nullable = true)
    private String implementationPlan;

    @Column(columnDefinition = "TEXT", nullable = true)
    private String risksAndConstraints;

    @Column(columnDefinition = "TEXT", nullable = true)
    private String conclusion;

    @Column(nullable = true)
    private String githubLink;

    @Column(nullable = true)
    private String pdfFileName;

    @Column(nullable = true)
    private String pdfFilePath;

    @Column(nullable = true)
    private Integer selfRating;

    @Column(nullable = true)
    private Integer marksAwarded;

    @Column(columnDefinition = "TEXT", nullable = true)
    private String facultyFeedback;

    @Column(columnDefinition = "TEXT", nullable = true)
    private String reevalReason;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private SubmissionStatus status;

    @Column(nullable = true)
    private LocalDateTime submittedAt;

    @Column(nullable = true)
    private LocalDateTime evaluatedAt;
}
