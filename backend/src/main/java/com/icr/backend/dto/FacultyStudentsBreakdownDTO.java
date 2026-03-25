package com.icr.backend.dto;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class FacultyStudentsBreakdownDTO {

    private Long facultyId;
    private String facultyName;
    private List<FacultyStudentSubmissionDTO> approvedStudents;
    private List<FacultyStudentSubmissionDTO> pendingStudents;
    private List<FacultyStudentSubmissionDTO> rejectedStudents;
}
