package com.icr.backend.dto.response;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class FacultyStudentAnalyticsResponse {

    private Long facultyId;
    private String facultyName;
    private String facultyEmail;
    private long totalStudents;
    private long approvedStudents;
    private long pendingStudents;
    private long rejectedStudents;
}
