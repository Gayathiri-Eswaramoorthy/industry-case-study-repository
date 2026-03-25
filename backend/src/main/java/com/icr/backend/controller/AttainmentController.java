package com.icr.backend.controller;

import com.icr.backend.dto.MyCoAttainmentResponse;
import com.icr.backend.dto.MyPoAttainmentResponse;
import com.icr.backend.entity.User;
import com.icr.backend.exception.ResourceNotFoundException;
import com.icr.backend.repository.UserRepository;
import com.icr.backend.service.AttainmentService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/attainment")
@RequiredArgsConstructor
public class AttainmentController {

    private final AttainmentService attainmentService;
    private final UserRepository userRepository;

    @GetMapping("/my/co")
    @PreAuthorize("hasRole('STUDENT')")
    public List<MyCoAttainmentResponse> getMyCoAttainment(Authentication authentication) {
        Long studentId = getCurrentStudentId(authentication);
        // FIXED: Student CO attainment endpoint is now current-user scoped and returns [] when no evaluations exist.
        return attainmentService.getStudentCoAttainment(studentId);
    }

    @GetMapping("/my/po")
    @PreAuthorize("hasRole('STUDENT')")
    public List<MyPoAttainmentResponse> getMyPoAttainment(Authentication authentication) {
        Long studentId = getCurrentStudentId(authentication);
        // FIXED: Student PO attainment endpoint is now current-user scoped and returns [] when no evaluations exist.
        return attainmentService.getStudentPoAttainment(studentId);
    }

    private Long getCurrentStudentId(Authentication authentication) {
        if (authentication == null || authentication.getName() == null) {
            throw new ResourceNotFoundException("Authenticated user not found");
        }
        User student = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new ResourceNotFoundException("Authenticated user not found"));
        return student.getId();
    }
}
