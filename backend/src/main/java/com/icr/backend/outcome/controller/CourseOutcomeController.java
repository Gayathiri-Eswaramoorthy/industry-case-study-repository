package com.icr.backend.outcome.controller;

import com.icr.backend.outcome.dto.CourseOutcomeResponse;
import com.icr.backend.outcome.service.CourseOutcomeService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/course-outcomes")
@RequiredArgsConstructor
public class CourseOutcomeController {

    private final CourseOutcomeService courseOutcomeService;

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public CourseOutcomeResponse createCourseOutcome(
            @RequestParam String code,
            @RequestParam String description,
            @RequestParam Long courseId) {

        return courseOutcomeService.createCourseOutcome(code, description, courseId);
    }

    @GetMapping("/{courseId}")
    @PreAuthorize("hasAnyRole('ADMIN','FACULTY','STUDENT')")
    public List<CourseOutcomeResponse> getByCourse(@PathVariable Long courseId) {

        return courseOutcomeService.getCourseOutcomesByCourse(courseId);
    }
}