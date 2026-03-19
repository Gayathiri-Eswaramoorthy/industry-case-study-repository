package com.icr.backend.casestudy.controller;

import com.icr.backend.casestudy.dto.CaseAssignmentRequest;
import com.icr.backend.casestudy.dto.CaseAssignmentResponse;
import com.icr.backend.casestudy.dto.CaseStudyResponse;
import com.icr.backend.casestudy.entity.CaseAssignment;
import com.icr.backend.casestudy.entity.CaseStudy;
import com.icr.backend.casestudy.repository.CaseAssignmentRepository;
import com.icr.backend.casestudy.repository.CaseStudyRepository;
import com.icr.backend.casestudy.service.CaseStudyService;
import com.icr.backend.entity.User;
import com.icr.backend.enums.RoleType;
import com.icr.backend.exception.ResourceNotFoundException;
import com.icr.backend.repository.UserRepository;
import io.swagger.v3.oas.annotations.Operation;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/admin/cases")
@RequiredArgsConstructor
public class AdminCaseController {

    private final CaseStudyService caseStudyService;
    private final CaseStudyRepository caseStudyRepository;
    private final CaseAssignmentRepository caseAssignmentRepository;
    private final UserRepository userRepository;

    @PutMapping("/{id}/publish")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Publish case")
    public CaseStudyResponse publishCase(@PathVariable Long id) {
        return caseStudyService.publishCase(id);
    }

    @PostMapping("/{id}/assign")
    @PreAuthorize("hasRole('ADMIN')")
    @Transactional
    @Operation(summary = "Assign faculty to admin-created case")
    public List<CaseAssignmentResponse> assignFaculty(
            @PathVariable Long id,
            @RequestBody CaseAssignmentRequest request
    ) {
        CaseStudy caseStudy = caseStudyRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Case not found with id: " + id));

        if (caseStudy.getCreatedBy() == null ||
                caseStudy.getCreatedBy().getRole() == null ||
                caseStudy.getCreatedBy().getRole().getName() != RoleType.ADMIN) {
            throw new IllegalArgumentException("Only admin-created cases can be assigned");
        }

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) {
            throw new RuntimeException("User not authenticated");
        }

        User admin = userRepository.findByEmail(auth.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));

        caseAssignmentRepository.deleteAllByCaseStudyId(id);

        List<Long> facultyIds = request != null && request.getFacultyIds() != null
                ? request.getFacultyIds()
                : List.of();

        return facultyIds.stream()
                .distinct()
                .map(facultyId -> {
                    User faculty = userRepository.findById(facultyId)
                            .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + facultyId));

                    if (faculty.getRole() == null || faculty.getRole().getName() != RoleType.FACULTY) {
                        throw new IllegalArgumentException("User is not faculty: " + facultyId);
                    }

                    CaseAssignment assignment = caseAssignmentRepository.save(
                            CaseAssignment.builder()
                                    .caseStudy(caseStudy)
                                    .faculty(faculty)
                                    .assignedBy(admin)
                                    .assignedAt(LocalDateTime.now())
                                    .build()
                    );

                    return CaseAssignmentResponse.builder()
                            .facultyId(faculty.getId())
                            .fullName(faculty.getFullName())
                            .email(faculty.getEmail())
                            .assignedAt(assignment.getAssignedAt())
                            .build();
                })
                .toList();
    }

    @GetMapping("/{id}/assignments")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Get faculty assignments for case")
    public List<CaseAssignmentResponse> getAssignments(@PathVariable Long id) {
        return caseAssignmentRepository.findByCaseStudyId(id)
                .stream()
                .map(assignment -> CaseAssignmentResponse.builder()
                        .facultyId(assignment.getFaculty().getId())
                        .fullName(assignment.getFaculty().getFullName())
                        .email(assignment.getFaculty().getEmail())
                        .assignedAt(assignment.getAssignedAt())
                        .build())
                .toList();
    }
}
