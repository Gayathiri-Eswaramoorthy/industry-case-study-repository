package com.icr.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class DashboardStatsResponse {
    private Long totalUsers;
    private Long totalCases;
    private Long totalSubmissions;
    private Long activeCases;
    private Long pendingReviews;
    private Long activeFaculty;
}
