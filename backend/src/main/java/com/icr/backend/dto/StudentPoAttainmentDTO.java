package com.icr.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class StudentPoAttainmentDTO {
    private Long programOutcomeId;
    private String programOutcomeCode;
    private String programOutcomeDescription;
    private Double averageScore;
    private String attainmentStatus;
}
