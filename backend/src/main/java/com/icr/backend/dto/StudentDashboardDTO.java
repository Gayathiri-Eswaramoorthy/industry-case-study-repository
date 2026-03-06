package com.icr.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class StudentDashboardDTO {
    private long totalCases;
    private long mySubmissions;
    private long completionRate;
    private long activeCases;
    private long submitted;
    private long pendingReview;
}
