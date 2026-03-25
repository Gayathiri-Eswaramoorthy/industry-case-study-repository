package com.icr.backend.controller;

import com.icr.backend.dto.response.UserResponse;
import com.icr.backend.service.UserService;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
@Tag(name = "Approval")
public class ApprovalController {

    private final UserService userService;

    // Admin endpoints
    @GetMapping("/admin/pending-faculty")
    @PreAuthorize("hasRole('ADMIN')")
    public List<UserResponse> getPendingFaculty() {
        return userService.getPendingFaculty();
    }

    @PutMapping("/admin/faculty/{id}/approve")
    @PreAuthorize("hasRole('ADMIN')")
    public UserResponse approveFaculty(@PathVariable Long id) {
        return userService.approveFaculty(id);
    }

    @PutMapping("/admin/faculty/{id}/reject")
    @PreAuthorize("hasRole('ADMIN')")
    public UserResponse rejectFaculty(
            @PathVariable Long id,
            @RequestParam String reason) {
        return userService.rejectFaculty(id, reason);
    }

    // Faculty endpoints
    @GetMapping("/faculty/pending-students")
    @PreAuthorize("hasRole('FACULTY')")
    public List<UserResponse> getPendingStudents() {
        return userService.getPendingStudents();
    }

    @GetMapping("/faculty/students/assigned")
    @PreAuthorize("hasRole('FACULTY')")
    public List<UserResponse> getAssignedStudents() {
        return userService.getAssignedStudents();
    }

    @PutMapping("/faculty/students/{id}/approve")
    @PreAuthorize("hasRole('FACULTY')")
    public UserResponse approveStudent(@PathVariable Long id) {
        return userService.approveStudent(id);
    }

    @PutMapping("/faculty/students/{id}/reject")
    @PreAuthorize("hasRole('FACULTY')")
    public UserResponse rejectStudent(
            @PathVariable Long id,
            @RequestParam String reason) {
        return userService.rejectStudent(id, reason);
    }

    // Public endpoint - pending users check their own status by email
    @GetMapping("/auth/registration-status")
    public UserResponse getRegistrationStatus(@RequestParam String email) {
        return userService.getRegistrationStatus(email);
    }
}
