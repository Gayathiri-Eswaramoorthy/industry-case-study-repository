package com.icr.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TopCaseAnalyticsDTO {
    private Long caseId;
    private String caseTitle;
    private long submissionCount;
    private double averageScore;
    private int topScore;
}

