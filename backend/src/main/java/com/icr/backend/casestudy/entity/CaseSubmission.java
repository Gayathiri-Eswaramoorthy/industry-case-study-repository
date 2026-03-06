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

    @Column(columnDefinition = "TEXT", nullable = false)
    private String solutionText;

    private Integer marksAwarded;

    private String facultyFeedback;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private SubmissionStatus status;

    private LocalDateTime submittedAt;

    private LocalDateTime evaluatedAt;
}
