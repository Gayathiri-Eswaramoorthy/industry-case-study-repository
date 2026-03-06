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
    private String studentName;
    private String caseTitle;
    private LocalDateTime submittedAt;
    private SubmissionStatus status;
}
