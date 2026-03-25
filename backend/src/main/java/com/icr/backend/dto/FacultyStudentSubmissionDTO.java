package com.icr.backend.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class FacultyStudentSubmissionDTO {

    private Long studentId;
    private String studentName;
    private String email;
    private String status;
    private long totalSubmissions;
    private long submitted;
    private long underReview;
    private long reevalRequested;
    private long evaluated;
}
