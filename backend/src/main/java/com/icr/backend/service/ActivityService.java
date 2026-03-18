package com.icr.backend.service;

import com.icr.backend.casestudy.enums.ActivityEvent;
import com.icr.backend.dto.ActivityItemResponse;
import com.icr.backend.dto.ActivityResponse;

import java.util.List;

public interface ActivityService {

    List<ActivityItemResponse> getStudentActivity(int limit);

    List<ActivityItemResponse> getFacultyActivity(int limit, Long courseId);

    List<ActivityItemResponse> getAdminActivity(int limit);

    void logEvent(Long studentId, Long caseStudyId, ActivityEvent event);

    void logCurrentStudentEvent(Long caseStudyId, ActivityEvent event);

    List<ActivityResponse> getStudentCaseTimeline(Long caseStudyId);
}
