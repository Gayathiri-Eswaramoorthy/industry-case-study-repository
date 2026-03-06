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
    private Integer marksAwarded;
    private String facultyFeedback;
    private SubmissionStatus status;
    private LocalDateTime submittedAt;
    private LocalDateTime evaluatedAt;
}
