package com.icr.backend.outcome.service;

import com.icr.backend.outcome.dto.CourseOutcomeResponse;

import java.util.List;

public interface CourseOutcomeService {


    CourseOutcomeResponse createCourseOutcome(String code,
                                              String description,
                                              Long courseId);

    List<CourseOutcomeResponse> getCourseOutcomesByCourse(Long courseId);
}