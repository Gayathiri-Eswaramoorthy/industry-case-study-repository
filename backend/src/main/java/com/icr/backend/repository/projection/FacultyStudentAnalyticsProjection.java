package com.icr.backend.repository.projection;

public interface FacultyStudentAnalyticsProjection {

    Long getFacultyId();

    String getFacultyName();

    String getFacultyEmail();

    Long getTotalStudents();

    Long getApprovedStudents();

    Long getPendingStudents();

    Long getRejectedStudents();
}
