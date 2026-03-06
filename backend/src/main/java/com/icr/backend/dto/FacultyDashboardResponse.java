package com.icr.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class FacultyDashboardResponse {
    private long totalCases;
    private long pendingReviews;
    private long evaluatedSubmissions;
    private long activeCases;
}
