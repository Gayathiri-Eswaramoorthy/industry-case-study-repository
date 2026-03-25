package com.icr.backend.controller;

import com.icr.backend.dto.response.FacultyStudentAnalyticsResponse;
import com.icr.backend.dto.response.PageResponse;
import com.icr.backend.dto.response.UserResponse;
import com.icr.backend.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/admin/students")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminStudentController {

    private final UserService userService;

    @PutMapping("/{studentId}/reassign")
    public ResponseEntity<String> reassignStudent(
            @PathVariable Long studentId,
            @RequestParam Long newFacultyId) {
        userService.reassignStudent(studentId, newFacultyId);
        return ResponseEntity.ok("Student reassigned successfully");
    }

    @GetMapping("/faculty-analytics")
    public List<FacultyStudentAnalyticsResponse> getFacultyStudentAnalytics() {
        return userService.getFacultyStudentAnalytics();
    }

    @GetMapping("/faculty/{facultyId}")
    public PageResponse<UserResponse> getStudentsByFaculty(
            @PathVariable Long facultyId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "ALL") String status
    ) {
        return userService.getStudentsByFaculty(facultyId, status, page, size);
    }
}
