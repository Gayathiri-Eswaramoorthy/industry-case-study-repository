package com.icr.backend.casestudy.dto;

import com.icr.backend.casestudy.enums.SubmissionStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StudentSubmissionResponse {

    private Long id;
    private Long caseId;
    private SubmissionStatus status;
    private Integer score;
    private String feedback;
    private LocalDateTime submittedAt;
    private LocalDateTime evaluatedAt;
}
