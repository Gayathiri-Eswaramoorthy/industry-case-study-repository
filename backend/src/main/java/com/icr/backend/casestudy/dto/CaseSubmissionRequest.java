package com.icr.backend.casestudy.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CaseSubmissionRequest {

    private Long caseId;
    private String answerText;
}