package com.icr.backend.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class OverallStatsDTO {

    private long totalUsers;
    private long totalFaculty;
    private long totalStudents;
    private long totalCases;
    private long totalSubmissions;
    private long approvedStudents;
    private long pendingStudents;
    private long rejectedStudents;
    private double overallApprovalRate;
}
