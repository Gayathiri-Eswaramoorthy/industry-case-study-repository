package com.icr.backend.controller;

import com.icr.backend.casestudy.dto.CaseStudyResponse;
import com.icr.backend.dto.AdminCoAttainmentSummaryResponse;
import com.icr.backend.dto.FacultyPerformanceDTO;
import com.icr.backend.dto.FacultyStudentsBreakdownDTO;
import com.icr.backend.dto.OverallStatsDTO;
import com.icr.backend.dto.response.ApiResponse;
import com.icr.backend.dto.response.PageResponse;
import com.icr.backend.casestudy.service.CaseStudyService;
import com.icr.backend.service.AnalyticsService;
import com.icr.backend.service.impl.AdminAnalyticsServiceImpl;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.time.LocalDateTime;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {

    private final CaseStudyService caseStudyService;
    private final AdminAnalyticsServiceImpl adminAnalyticsService;
    private final AnalyticsService analyticsService;

    @PutMapping("/cases/{id}/archive")
    @PreAuthorize("hasRole('ADMIN')")
    public CaseStudyResponse archiveCase(@PathVariable Long id) {
        // FIXED: Added ADMIN-only endpoint to archive any case study.
        return caseStudyService.archiveCase(id);
    }

    @GetMapping("/analytics/co-attainment")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<PageResponse<AdminCoAttainmentSummaryResponse>> getCoAttainmentSummary(
            @org.springframework.web.bind.annotation.RequestParam(defaultValue = "0") int page,
            @org.springframework.web.bind.annotation.RequestParam(defaultValue = "20") int size
    ) {
        List<AdminCoAttainmentSummaryResponse> allRows = adminAnalyticsService.getCoAttainmentSummary();
        int fromIndex = Math.min(page * size, allRows.size());
        int toIndex = Math.min(fromIndex + size, allRows.size());
        List<AdminCoAttainmentSummaryResponse> content = allRows.subList(fromIndex, toIndex);
        // HARDENED: Added pageable support for admin CO attainment analytics endpoint.
        return ApiResponse.<PageResponse<AdminCoAttainmentSummaryResponse>>builder()
                .success(true)
                .message("CO attainment analytics fetched successfully")
                .data(PageResponse.<AdminCoAttainmentSummaryResponse>builder()
                        .content(content)
                        .page(page)
                        .size(size)
                        .totalElements(allRows.size())
                        .totalPages(size == 0 ? 1 : (int) Math.ceil((double) allRows.size() / size))
                        .last(toIndex >= allRows.size())
                        .build())
                .timestamp(LocalDateTime.now())
                .build();
    }

    @GetMapping("/analytics/co-attainment/export")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<String> exportCoAttainmentSummary() {
        String csv = adminAnalyticsService.exportCoAttainmentCsv();
        // FIXED: Added ADMIN CSV export endpoint for platform-wide CO attainment reporting.
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"co-attainment-report.csv\"")
                .contentType(MediaType.parseMediaType("text/csv"))
                .body(csv);
    }

    @GetMapping("/cases")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<PageResponse<CaseStudyResponse>> getAllCases(
            @org.springframework.web.bind.annotation.RequestParam(defaultValue = "0") int page,
            @org.springframework.web.bind.annotation.RequestParam(defaultValue = "20") int size
    ) {
        Page<CaseStudyResponse> casePage = caseStudyService.getAllCases(
                null,
                PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"))
        );
        return ApiResponse.<PageResponse<CaseStudyResponse>>builder()
                .success(true)
                .message("Admin cases fetched successfully")
                .data(PageResponse.<CaseStudyResponse>builder()
                        .content(casePage.getContent())
                        .page(casePage.getNumber())
                        .size(casePage.getSize())
                        .totalElements(casePage.getTotalElements())
                        .totalPages(casePage.getTotalPages())
                        .last(casePage.isLast())
                        .build())
                .timestamp(LocalDateTime.now())
                .build();
    }

    @GetMapping("/faculty-performance")
    @PreAuthorize("hasRole('ADMIN')")
    public List<FacultyPerformanceDTO> getFacultyPerformance() {
        return analyticsService.getFacultyPerformance();
    }

    @GetMapping("/faculty-performance/{facultyId}/students")
    @PreAuthorize("hasRole('ADMIN')")
    public FacultyStudentsBreakdownDTO getFacultyStudentsBreakdown(@PathVariable Long facultyId) {
        try {
            return analyticsService.getFacultyStudentsBreakdown(facultyId);
        } catch (IllegalArgumentException ex) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, ex.getMessage(), ex);
        }
    }

    @GetMapping("/overall-stats")
    @PreAuthorize("hasRole('ADMIN')")
    public OverallStatsDTO getOverallStats() {
        return analyticsService.getOverallStats();
    }
}
