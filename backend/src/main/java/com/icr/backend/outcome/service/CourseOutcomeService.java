package com.icr.backend.outcome.service;

import com.icr.backend.outcome.dto.CourseOutcomeRequest;
import com.icr.backend.outcome.dto.CourseOutcomeResponse;

import java.util.List;

public interface CourseOutcomeService {

    CourseOutcomeResponse createCourseOutcome(CourseOutcomeRequest request);

    List<CourseOutcomeResponse> getCourseOutcomesByCourse(Long courseId);

    List<CourseOutcomeResponse> getAllCourseOutcomes();
}
