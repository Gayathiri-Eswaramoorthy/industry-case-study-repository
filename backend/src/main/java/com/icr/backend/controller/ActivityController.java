package com.icr.backend.controller;

import com.icr.backend.dto.ActivityItemResponse;
import com.icr.backend.dto.ActivityResponse;
import com.icr.backend.dto.request.ActivityEventRequest;
import com.icr.backend.service.ActivityService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
@Tag(name = "Activity")
public class ActivityController {

    private final ActivityService activityService;

    @GetMapping("/activity/student")
    @PreAuthorize("hasRole('STUDENT')")
    @Operation(summary = "Get student activity")
    public List<ActivityItemResponse> getStudentActivity(
            @RequestParam(name = "limit", defaultValue = "8") int limit) {

        return activityService.getStudentActivity(limit);
    }

    @GetMapping("/activity/faculty")
    @PreAuthorize("hasRole('FACULTY')")
    @Operation(summary = "Get faculty activity")
    public List<ActivityItemResponse> getFacultyActivity(
            @RequestParam(name = "limit", defaultValue = "8") int limit,
            @RequestParam(name = "courseId", required = false) Long courseId) {

        return activityService.getFacultyActivity(limit, courseId);
    }

    @GetMapping("/activity/admin")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Get admin activity")
    public List<ActivityItemResponse> getAdminActivity(
            @RequestParam(name = "limit", defaultValue = "8") int limit) {

        return activityService.getAdminActivity(limit);
    }

    @GetMapping("/student/cases/{caseId}/timeline")
    @PreAuthorize("hasRole('STUDENT')")
    @Operation(summary = "Get attempt timeline for the logged-in student and case")
    public List<ActivityResponse> getStudentCaseTimeline(@PathVariable Long caseId) {
        return activityService.getStudentCaseTimeline(caseId);
    }

    @PostMapping("/student/cases/{caseId}/activity")
    @PreAuthorize("hasRole('STUDENT')")
    @Operation(summary = "Log attempt timeline activity for the logged-in student and case")
    public void logStudentCaseActivity(
            @PathVariable Long caseId,
            @Valid @RequestBody ActivityEventRequest request) {
        activityService.logCurrentStudentEvent(caseId, request.getEvent());
    }
}
