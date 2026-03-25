package com.icr.backend.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class FacultyPerformanceDTO {

    private Long facultyId;
    private String facultyName;
    private long totalStudents;
    private long totalSubmissions;
    private long submitted;
    private long underReview;
    private long reevalRequested;
    private long evaluated;
    private long approved;
    private long rejected;
    private long pending;
    private double approvalRate;
}
