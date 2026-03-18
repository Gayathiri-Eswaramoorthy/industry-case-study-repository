package com.icr.backend.controller;

import com.icr.backend.dto.DashboardStatsResponse;
import com.icr.backend.dto.CoAttainmentSummaryDTO;
import com.icr.backend.dto.TopCaseAnalyticsDTO;
import com.icr.backend.service.AnalyticsService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;
import java.util.List;

@RestController
@RequestMapping("/api/admin/analytics")
@RequiredArgsConstructor
@Tag(name = "Analytics")
public class AnalyticsController {

    private final AnalyticsService analyticsService;

    @GetMapping("/dashboard")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Get dashboard statistics")
    public DashboardStatsResponse getDashboardStats() {
        return analyticsService.getDashboardStats();
    }

    @GetMapping("/users")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Get user analytics")
    public Map<String, Long> getUserAnalytics() {
        return analyticsService.getUserAnalytics();
    }

    @GetMapping("/cases")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Get case analytics")
    public Map<String, Long> getCaseAnalytics() {
        return analyticsService.getCaseAnalytics();
    }

    @GetMapping("/submissions")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Get submission analytics")
    public Map<String, Long> getSubmissionAnalytics() {
        return analyticsService.getSubmissionAnalytics();
    }

    @GetMapping("/co-attainment-summary")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Get platform-wide CO attainment summary")
    public List<CoAttainmentSummaryDTO> getCoAttainmentSummary() {
        return analyticsService.getCoAttainmentSummary();
    }

    @GetMapping("/top-cases")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Get top performing cases by average score")
    public List<TopCaseAnalyticsDTO> getTopCases() {
        return analyticsService.getTopCases();
    }
}
