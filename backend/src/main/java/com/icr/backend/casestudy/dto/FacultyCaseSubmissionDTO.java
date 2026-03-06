package com.icr.backend.casestudy.dto;

import com.icr.backend.casestudy.enums.SubmissionStatus;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class FacultyCaseSubmissionDTO {

    private Long submissionId;
    private String studentName;
    private LocalDateTime submittedAt;
    private SubmissionStatus status;
    private Integer score;
}
