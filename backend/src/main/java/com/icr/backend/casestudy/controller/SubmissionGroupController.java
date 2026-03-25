package com.icr.backend.casestudy.controller;

import com.icr.backend.casestudy.dto.CreateGroupRequest;
import com.icr.backend.casestudy.dto.SubmissionGroupDTO;
import com.icr.backend.casestudy.service.SubmissionGroupService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class SubmissionGroupController {

    private final SubmissionGroupService submissionGroupService;

    @PostMapping("/cases/{id}/groups")
    @PreAuthorize("hasRole('STUDENT')")
    public SubmissionGroupDTO createGroup(
            @PathVariable("id") Long caseId,
            @RequestBody CreateGroupRequest request
    ) {
        return submissionGroupService.createGroup(caseId, request);
    }

    @PostMapping("/cases/{id}/groups/{groupId}/join")
    @PreAuthorize("hasRole('STUDENT')")
    public SubmissionGroupDTO joinGroup(
            @PathVariable("id") Long caseId,
            @PathVariable Long groupId
    ) {
        return submissionGroupService.joinGroup(caseId, groupId);
    }

    @PutMapping("/cases/{id}/groups/{groupId}/members/{studentId}/approve")
    @PreAuthorize("hasRole('STUDENT')")
    public SubmissionGroupDTO approveMember(
            @PathVariable("id") Long caseId,
            @PathVariable Long groupId,
            @PathVariable Long studentId
    ) {
        return submissionGroupService.approveMember(caseId, groupId, studentId);
    }

    @PutMapping("/cases/{id}/groups/{groupId}/members/{studentId}/reject")
    @PreAuthorize("hasRole('STUDENT')")
    public SubmissionGroupDTO rejectMember(
            @PathVariable("id") Long caseId,
            @PathVariable Long groupId,
            @PathVariable Long studentId
    ) {
        return submissionGroupService.rejectMember(caseId, groupId, studentId);
    }

    @DeleteMapping("/cases/{id}/groups/{groupId}/leave")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<Void> leaveGroup(
            @PathVariable("id") Long caseId,
            @PathVariable Long groupId
    ) {
        submissionGroupService.leaveGroup(caseId, groupId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/cases/{id}/groups")
    @PreAuthorize("hasAnyRole('FACULTY','ADMIN')")
    public List<SubmissionGroupDTO> getAllGroups(@PathVariable("id") Long caseId) {
        return submissionGroupService.getAllGroupsForCase(caseId);
    }

    @GetMapping("/cases/{id}/my-group")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<SubmissionGroupDTO> getMyGroup(@PathVariable("id") Long caseId) {
        SubmissionGroupDTO group = submissionGroupService.getMyGroup(caseId);
        if (group == null) {
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.ok(group);
    }
}
