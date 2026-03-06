package com.icr.backend.controller;

import com.icr.backend.dto.FacultyAnalyticsDTO;
import com.icr.backend.service.FacultyAnalyticsService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/faculty")
@RequiredArgsConstructor
public class FacultyAnalyticsController {

    private final FacultyAnalyticsService analyticsService;

    @GetMapping("/analytics")
    @PreAuthorize("hasRole('FACULTY')")
    public ResponseEntity<FacultyAnalyticsDTO> getAnalytics() {
        return ResponseEntity.ok(analyticsService.getAnalytics());
    }
}
