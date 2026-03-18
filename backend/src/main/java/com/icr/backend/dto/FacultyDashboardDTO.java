package com.icr.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class FacultyDashboardDTO {

    private long totalCases;
    private long ownCases;
    private long pendingReviews;
    private long evaluatedSubmissions;
    private long publishedCases;
}
