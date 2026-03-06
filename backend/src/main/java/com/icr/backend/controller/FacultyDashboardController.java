package com.icr.backend.controller;

import com.icr.backend.dto.FacultyDashboardDTO;
import com.icr.backend.service.FacultyDashboardService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.http.ResponseEntity;

@RestController
@RequestMapping("/api/faculty")
@RequiredArgsConstructor
@Tag(name = "Faculty Dashboard")
public class FacultyDashboardController {

    private final FacultyDashboardService dashboardService;

    @GetMapping("/dashboard")
    @PreAuthorize("hasRole('FACULTY')")
    @Operation(summary = "Get faculty dashboard statistics")
    public ResponseEntity<FacultyDashboardDTO> getDashboard() {
        return ResponseEntity.ok(dashboardService.getDashboardMetrics());
    }
}
