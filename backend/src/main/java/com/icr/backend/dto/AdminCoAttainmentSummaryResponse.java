package com.icr.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AdminCoAttainmentSummaryResponse {

    private Long coId;
    private String coCode;
    private String coDescription;
    private long totalStudents;
    private long attainedCount;
    private long partialCount;
    private long notAttainedCount;
    private double attainmentRate;
}
