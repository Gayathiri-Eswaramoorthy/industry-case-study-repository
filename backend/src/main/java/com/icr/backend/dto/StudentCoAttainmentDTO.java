package com.icr.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class StudentCoAttainmentDTO {
    private Long courseOutcomeId;
    private String courseOutcomeCode;
    private String courseOutcomeDescription;
    private Integer score;
    private String attainmentStatus;
}
