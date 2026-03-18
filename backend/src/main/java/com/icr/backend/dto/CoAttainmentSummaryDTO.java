package com.icr.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CoAttainmentSummaryDTO {
    private String coCode;
    private String coDescription;
    private double averageScore;
    private long attainedCount;
    private long totalCount;
}

