package com.icr.backend.outcome.controller;

import com.icr.backend.dto.response.ApiResponse;
import com.icr.backend.outcome.dto.CourseOutcomeRequest;
import com.icr.backend.outcome.dto.CourseOutcomeResponse;
import com.icr.backend.outcome.service.CourseOutcomeService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/course-outcomes")
@RequiredArgsConstructor
public class CourseOutcomeController {

    private final CourseOutcomeService courseOutcomeService;

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','FACULTY')")
    public ApiResponse<CourseOutcomeResponse> createCourseOutcome(@RequestBody CourseOutcomeRequest request) {
        return ApiResponse.<CourseOutcomeResponse>builder()
                .success(true)
                .message("Course outcome created successfully")
                .data(courseOutcomeService.createCourseOutcome(request))
                .timestamp(LocalDateTime.now())
                .build();
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','FACULTY','STUDENT')")
    public ApiResponse<List<CourseOutcomeResponse>> getAllCourseOutcomes() {
        return ApiResponse.<List<CourseOutcomeResponse>>builder()
                .success(true)
                .message("Course outcomes fetched successfully")
                .data(courseOutcomeService.getAllCourseOutcomes())
                .timestamp(LocalDateTime.now())
                .build();
    }

    @GetMapping("/{courseId}")
    @PreAuthorize("hasAnyRole('ADMIN','FACULTY','STUDENT')")
    public ApiResponse<List<CourseOutcomeResponse>> getByCourse(@PathVariable Long courseId) {
        return ApiResponse.<List<CourseOutcomeResponse>>builder()
                .success(true)
                .message("Course outcomes fetched successfully")
                .data(courseOutcomeService.getCourseOutcomesByCourse(courseId))
                .timestamp(LocalDateTime.now())
                .build();
    }
}
