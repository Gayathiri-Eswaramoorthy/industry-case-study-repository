package com.icr.backend.casestudy.controller;

import com.icr.backend.casestudy.dto.CaseStudyRequest;
import com.icr.backend.casestudy.dto.CaseStudyResponse;
import com.icr.backend.casestudy.service.CaseStudyService;
import com.icr.backend.dto.response.ApiResponse;
import com.icr.backend.enums.CaseStatus;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;

@RestController
@RequestMapping("/api/cases")
@RequiredArgsConstructor
@Tag(name = "Case Studies")
public class CaseStudyController {

    private final CaseStudyService caseStudyService;
    private static final Set<String> ALLOWED_CASE_MATERIAL_EXTENSIONS =
            Set.of("pdf", "csv", "xlsx", "xls", "json", "zip");

    @Value("${app.case-material.upload-dir:uploads/case-materials}")
    private String caseMaterialUploadDir;

    // Faculty creates case (DRAFT by default)
    @PostMapping(consumes = MediaType.APPLICATION_JSON_VALUE)
    @PreAuthorize("hasAnyRole('ADMIN','FACULTY')")
    @Operation(summary = "Create case study")
    public CaseStudyResponse createCase(@RequestBody CaseStudyRequest request) {
        return caseStudyService.createCase(request);
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAnyRole('ADMIN','FACULTY')")
    @Operation(summary = "Create case study with case material")
    public CaseStudyResponse createCaseWithMaterial(
            @RequestPart("request") CaseStudyRequest request,
            @RequestPart(value = "caseMaterial", required = false) MultipartFile caseMaterial
    ) {
        if (caseMaterial != null && !caseMaterial.isEmpty()) {
            request.setCaseMaterialPath(storeCaseMaterial(caseMaterial));
        }
        return caseStudyService.createCase(request);
    }

    // Get all cases for a course (Faculty/Admin)
    @GetMapping("/course/{courseId}")
    @PreAuthorize("hasAnyRole('ADMIN','FACULTY','STUDENT')")
    @Operation(summary = "Get cases by course")
    public ApiResponse<List<CaseStudyResponse>> getCasesByCourse(
            @PathVariable Long courseId,
            Authentication authentication,
            @RequestParam(required = false) CaseStatus status
    ) {
        List<CaseStudyResponse> cases = caseStudyService.getCasesByCourse(courseId, status);

        return ApiResponse.<List<CaseStudyResponse>>builder()
                .success(true)
                .message("Cases fetched successfully")
                .data(cases)
                .timestamp(LocalDateTime.now())
                .build();
    }

    // Students see only PUBLISHED cases
    @GetMapping("/course/{courseId}/published")
    @PreAuthorize("hasAnyRole('ADMIN','FACULTY','STUDENT')")
    @Operation(summary = "Get published cases by course")
    public ApiResponse<List<CaseStudyResponse>> getPublishedCases(@PathVariable Long courseId) {
        List<CaseStudyResponse> cases = caseStudyService.getPublishedCasesByCourse(courseId);

        return ApiResponse.<List<CaseStudyResponse>>builder()
                .success(true)
                .message("Published cases fetched successfully")
                .data(cases)
                .timestamp(LocalDateTime.now())
                .build();
    }

    // Get case by id (Students can access only if PUBLISHED)
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','FACULTY','STUDENT')")
    @Operation(summary = "Get case by id")
    public ApiResponse<CaseStudyResponse> getCaseById(@PathVariable Long id) {
        CaseStudyResponse response = caseStudyService.getCaseById(id);

        return ApiResponse.<CaseStudyResponse>builder()
                .success(true)
                .message("Case fetched successfully")
                .data(response)
                .timestamp(LocalDateTime.now())
                .build();
    }

    private String storeCaseMaterial(MultipartFile caseMaterial) {
        String originalFilename = StringUtils.cleanPath(
                caseMaterial.getOriginalFilename() != null ? caseMaterial.getOriginalFilename() : "material"
        );
        String extension = "";
        int dotIndex = originalFilename.lastIndexOf('.');
        if (dotIndex >= 0 && dotIndex < originalFilename.length() - 1) {
            extension = originalFilename.substring(dotIndex + 1).toLowerCase(Locale.ROOT);
        }

        if (extension.isBlank() || !ALLOWED_CASE_MATERIAL_EXTENSIONS.contains(extension)) {
            throw new IllegalArgumentException("Unsupported case material type. Allowed: PDF, CSV, XLSX, JSON, ZIP");
        }

        try {
            Path uploadRoot = Paths.get(caseMaterialUploadDir).toAbsolutePath().normalize();
            Files.createDirectories(uploadRoot);
            String storedFileName = UUID.randomUUID() + "_" + originalFilename.replace(" ", "_");
            Path destination = uploadRoot.resolve(storedFileName).normalize();
            Files.copy(caseMaterial.getInputStream(), destination);
            return destination.toString();
        } catch (IOException ex) {
            throw new RuntimeException("Failed to store case material file", ex);
        }
    }
}
