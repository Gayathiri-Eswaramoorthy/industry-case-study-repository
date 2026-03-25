package com.icr.backend.casestudy.controller;

import com.icr.backend.casestudy.dto.CaseExhibitDTO;
import com.icr.backend.casestudy.dto.CaseStudyRequest;
import com.icr.backend.casestudy.dto.CaseStudyResponse;
import com.icr.backend.casestudy.entity.CaseExhibit;
import com.icr.backend.casestudy.entity.CaseStudy;
import com.icr.backend.casestudy.repository.CaseExhibitRepository;
import com.icr.backend.casestudy.repository.CaseTagRepository;
import com.icr.backend.casestudy.repository.CaseStudyRepository;
import com.icr.backend.casestudy.service.CaseStudyService;
import com.icr.backend.dto.response.ApiResponse;
import com.icr.backend.dto.response.PageResponse;
import com.icr.backend.entity.User;
import com.icr.backend.enums.CaseStatus;
import com.icr.backend.exception.ResourceNotFoundException;
import com.icr.backend.repository.UserRepository;
import com.icr.backend.storage.StorageService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpHeaders;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;

@RestController
@RequestMapping("/api/cases")
@RequiredArgsConstructor
@Tag(name = "Case Studies")
@Slf4j
public class CaseStudyController {

    private final CaseStudyService caseStudyService;
    private final CaseStudyRepository caseStudyRepository;
    private final CaseExhibitRepository caseExhibitRepository;
    private final CaseTagRepository caseTagRepository;
    private final UserRepository userRepository;
    private final StorageService storageService;
    private static final Set<String> ALLOWED_CASE_MATERIAL_EXTENSIONS =
            Set.of("pdf", "csv", "xlsx", "xls", "json", "zip");

    // Faculty creates case (DRAFT by default)
    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','FACULTY','STUDENT')")
    @Operation(summary = "Get all case studies")
    public ApiResponse<PageResponse<CaseStudyResponse>> getAllCases(
            @RequestParam(required = false) CaseStatus status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        Page<CaseStudyResponse> cases;
        if (status == null) {
            cases = caseStudyService.getAllCases(
                    PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"))
            );
        } else {
            cases = caseStudyService.getAllCases(
                    status,
                    PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"))
            );
        }

        return ApiResponse.<PageResponse<CaseStudyResponse>>builder()
                .success(true)
                .message("Cases fetched successfully")
                .data(PageResponse.<CaseStudyResponse>builder()
                        .content(cases.getContent())
                        .page(cases.getNumber())
                        .size(cases.getSize())
                        .totalElements(cases.getTotalElements())
                        .totalPages(cases.getTotalPages())
                        .last(cases.isLast())
                        .build())
                .timestamp(LocalDateTime.now())
                .build();
    }

    @PostMapping(consumes = MediaType.APPLICATION_JSON_VALUE)
    @PreAuthorize("hasAnyRole('ADMIN','FACULTY')")
    @Operation(summary = "Create case study")
    public CaseStudyResponse createCase(@Valid @RequestBody CaseStudyRequest request) {
        return caseStudyService.createCase(request);
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAnyRole('ADMIN','FACULTY')")
    @Operation(summary = "Create case study with case material")
    public CaseStudyResponse createCaseWithMaterial(
            @Valid @RequestPart("request") CaseStudyRequest request,
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
    public ApiResponse<PageResponse<CaseStudyResponse>> getCasesByCourse(
            @PathVariable Long courseId,
            Authentication authentication,
            @RequestParam(required = false) CaseStatus status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        Page<CaseStudyResponse> cases = caseStudyService.getCasesByCourse(
                courseId,
                status,
                PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"))
        );

        return ApiResponse.<PageResponse<CaseStudyResponse>>builder()
                .success(true)
                .message("Cases fetched successfully")
                .data(PageResponse.<CaseStudyResponse>builder()
                        .content(cases.getContent())
                        .page(cases.getNumber())
                        .size(cases.getSize())
                        .totalElements(cases.getTotalElements())
                        .totalPages(cases.getTotalPages())
                        .last(cases.isLast())
                        .build())
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

    @GetMapping("/{id}/related")
    @PreAuthorize("hasAnyRole('ADMIN','FACULTY','STUDENT')")
    @Operation(summary = "Get related cases")
    public ApiResponse<List<CaseStudyResponse>> getRelatedCases(@PathVariable Long id) {
        List<CaseStudyResponse> relatedCases = caseStudyService.getRelatedCases(id);

        return ApiResponse.<List<CaseStudyResponse>>builder()
                .success(true)
                .message("Related cases fetched successfully")
                .data(relatedCases)
                .timestamp(LocalDateTime.now())
                .build();
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','FACULTY')")
    @Operation(summary = "Delete case study")
    public ApiResponse<Void> deleteCase(@PathVariable Long id) {
        caseStudyService.deleteCase(id);

        return ApiResponse.<Void>builder()
                .success(true)
                .message("Case deleted successfully")
                .data(null)
                .timestamp(LocalDateTime.now())
                .build();
    }

    @PutMapping("/{id}/publish")
    @PreAuthorize("hasAnyRole('ADMIN','FACULTY')")
    @Operation(summary = "Publish case study")
    public CaseStudyResponse publishCase(@PathVariable Long id) {
        return caseStudyService.publishCase(id);
    }

    @GetMapping("/tags")
    @PreAuthorize("hasAnyRole('ADMIN','FACULTY','STUDENT')")
    @Operation(summary = "Get all distinct tags")
    public ApiResponse<List<String>> getAllTags() {
        return ApiResponse.<List<String>>builder()
                .success(true)
                .message("Tags fetched successfully")
                .data(caseTagRepository.findDistinctTagValues())
                .timestamp(LocalDateTime.now())
                .build();
    }

    @GetMapping("/search")
    @PreAuthorize("hasAnyRole('ADMIN','FACULTY','STUDENT')")
    @Operation(summary = "Search and filter case studies")
    public ApiResponse<PageResponse<CaseStudyResponse>> searchCases(
            @RequestParam(required = false) String q,
            @RequestParam(required = false) CaseStatus status,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String difficulty,
            @RequestParam(required = false) List<String> tags,
            @RequestParam(required = false) Integer minYear,
            @RequestParam(required = false) Integer maxYear,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sort
    ) {
        Sort sortObj = switch (sort) {
            case "title" -> Sort.by(Sort.Direction.ASC, "title");
            case "submissionCount" -> Sort.by(Sort.Direction.DESC, "createdAt");
            default -> Sort.by(Sort.Direction.DESC, "createdAt");
        };

        Page<CaseStudyResponse> cases = caseStudyService.searchCases(
                q, status, category, difficulty, tags, minYear, maxYear,
                sort,
                PageRequest.of(page, size, sortObj)
        );

        return ApiResponse.<PageResponse<CaseStudyResponse>>builder()
                .success(true)
                .message("Search results fetched successfully")
                .data(PageResponse.<CaseStudyResponse>builder()
                        .content(cases.getContent())
                        .page(cases.getNumber())
                        .size(cases.getSize())
                        .totalElements(cases.getTotalElements())
                        .totalPages(cases.getTotalPages())
                        .last(cases.isLast())
                        .build())
                .timestamp(LocalDateTime.now())
                .build();
    }

    @PostMapping(value = "/{id}/document", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAnyRole('ADMIN','FACULTY')")
    @Operation(summary = "Upload case document PDF")
    public ResponseEntity<String> uploadCaseDocument(
            @PathVariable Long id,
            @RequestPart("file") MultipartFile file) {

        if (file == null || file.isEmpty()) {
            return ResponseEntity.badRequest().body("File is required");
        }
        String originalName = StringUtils.cleanPath(
                file.getOriginalFilename() != null ? file.getOriginalFilename() : "document.pdf");
        if (!originalName.toLowerCase().endsWith(".pdf")) {
            return ResponseEntity.badRequest().body("Only PDF files are allowed");
        }

        CaseStudy caseStudy = caseStudyRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Case not found with id: " + id));

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        boolean isAdmin = auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        if (!isAdmin) {
            String email = auth.getName();
            User faculty = userRepository.findByEmail(email)
                    .orElseThrow(() -> new ResourceNotFoundException("User not found"));
            if (caseStudy.getCreatedBy() == null ||
                    !caseStudy.getCreatedBy().getId().equals(faculty.getId())) {
                throw new AccessDeniedException("You can only upload documents to your own cases");
            }
        }

        try {
            Path dir = Paths.get("uploads", "cases", String.valueOf(id)).toAbsolutePath().normalize();
            Files.createDirectories(dir);
            Path destination = dir.resolve("document.pdf");
            Files.copy(file.getInputStream(), destination, StandardCopyOption.REPLACE_EXISTING);
            caseStudy.setCaseDocumentPath(destination.toString());
            caseStudy.setCaseDocumentOriginalName(originalName);
            caseStudyRepository.save(caseStudy);
            return ResponseEntity.ok("Document uploaded successfully");
        } catch (IOException ex) {
            throw new RuntimeException("Failed to store case document", ex);
        }
    }

    @GetMapping("/{id}/document")
    @PreAuthorize("hasAnyRole('ADMIN','FACULTY','STUDENT')")
    @Operation(summary = "Download case document PDF")
    public ResponseEntity<Resource> downloadCaseDocument(@PathVariable Long id) {
        CaseStudy caseStudy = caseStudyRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Case not found with id: " + id));

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        boolean isStudent = auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_STUDENT"));
        if (isStudent && caseStudy.getStatus() != CaseStatus.PUBLISHED) {
            throw new ResourceNotFoundException("Case not found with id: " + id);
        }

        if (caseStudy.getCaseDocumentPath() == null || caseStudy.getCaseDocumentPath().isBlank()) {
            return ResponseEntity.notFound().build();
        }

        try {
            Path filePath = Paths.get(caseStudy.getCaseDocumentPath()).normalize();
            Resource resource = new UrlResource(filePath.toUri());
            if (!resource.exists() || !resource.isReadable()) {
                return ResponseEntity.notFound().build();
            }
            String downloadName = caseStudy.getCaseDocumentOriginalName() != null
                    ? caseStudy.getCaseDocumentOriginalName()
                    : "case-document.pdf";
            return ResponseEntity.ok()
                    .contentType(MediaType.APPLICATION_PDF)
                    .header(HttpHeaders.CONTENT_DISPOSITION,
                            "attachment; filename=\"" + downloadName + "\"")
                    .body(resource);
        } catch (Exception ex) {
            throw new RuntimeException("Failed to serve case document", ex);
        }
    }

    @PostMapping(value = "/{id}/teaching-notes", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAnyRole('ADMIN','FACULTY')")
    @Operation(summary = "Upload teaching notes PDF")
    public ResponseEntity<String> uploadTeachingNotes(
            @PathVariable Long id,
            @RequestPart("file") MultipartFile file) {

        if (file == null || file.isEmpty()) {
            return ResponseEntity.badRequest().body("File is required");
        }
        String originalName = StringUtils.cleanPath(
                file.getOriginalFilename() != null ? file.getOriginalFilename() : "teaching-notes.pdf");
        if (!originalName.toLowerCase().endsWith(".pdf")) {
            return ResponseEntity.badRequest().body("Only PDF files are allowed");
        }

        CaseStudy caseStudy = caseStudyRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Case not found with id: " + id));

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        boolean isAdmin = auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        if (!isAdmin) {
            String email = auth.getName();
            User faculty = userRepository.findByEmail(email)
                    .orElseThrow(() -> new ResourceNotFoundException("User not found"));
            if (caseStudy.getCreatedBy() == null ||
                    !caseStudy.getCreatedBy().getId().equals(faculty.getId())) {
                throw new AccessDeniedException("You can only upload teaching notes to your own cases");
            }
        }

        try {
            Path dir = Paths.get("uploads", "cases", String.valueOf(id)).toAbsolutePath().normalize();
            Files.createDirectories(dir);
            Path destination = dir.resolve("teaching-notes.pdf");
            Files.copy(file.getInputStream(), destination, StandardCopyOption.REPLACE_EXISTING);
            caseStudy.setTeachingNotesPath(destination.toString());
            caseStudy.setTeachingNotesOriginalName(originalName);
            caseStudyRepository.save(caseStudy);
            return ResponseEntity.ok("Teaching notes uploaded successfully");
        } catch (IOException ex) {
            throw new RuntimeException("Failed to store teaching notes", ex);
        }
    }

    @GetMapping("/{id}/teaching-notes")
    @PreAuthorize("hasAnyRole('ADMIN','FACULTY')")
    @Operation(summary = "Download teaching notes PDF")
    public ResponseEntity<Resource> downloadTeachingNotes(@PathVariable Long id) {
        CaseStudy caseStudy = caseStudyRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Case not found with id: " + id));

        if (caseStudy.getTeachingNotesPath() == null
                || caseStudy.getTeachingNotesPath().isBlank()) {
            return ResponseEntity.notFound().build();
        }

        try {
            Path filePath = Paths.get(caseStudy.getTeachingNotesPath()).normalize();
            Resource resource = new UrlResource(filePath.toUri());
            if (!resource.exists() || !resource.isReadable()) {
                return ResponseEntity.notFound().build();
            }
            String downloadName = caseStudy.getTeachingNotesOriginalName() != null
                    ? caseStudy.getTeachingNotesOriginalName()
                    : "teaching-notes.pdf";
            return ResponseEntity.ok()
                    .contentType(MediaType.APPLICATION_PDF)
                    .header(HttpHeaders.CONTENT_DISPOSITION,
                            "attachment; filename=\"" + downloadName + "\"")
                    .body(resource);
        } catch (Exception ex) {
            throw new RuntimeException("Failed to serve teaching notes", ex);
        }
    }

    @PostMapping(value = "/{id}/exhibits", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAnyRole('ADMIN','FACULTY')")
    @Operation(summary = "Upload case exhibit")
    public ResponseEntity<CaseExhibitDTO> uploadExhibit(
            @PathVariable Long id,
            @RequestParam("title") String title,
            @RequestParam(value = "description", required = false) String description,
            @RequestPart("file") MultipartFile file) {

        if (file == null || file.isEmpty()) {
            return ResponseEntity.badRequest().build();
        }

        CaseStudy caseStudy = caseStudyRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Case not found with id: " + id));

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        boolean isAdmin = auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        if (!isAdmin) {
            String email = auth.getName();
            User faculty = userRepository.findByEmail(email)
                    .orElseThrow(() -> new ResourceNotFoundException("User not found"));
            if (caseStudy.getCreatedBy() == null ||
                    !caseStudy.getCreatedBy().getId().equals(faculty.getId())) {
                throw new AccessDeniedException("You can only add exhibits to your own cases");
            }
        }

        try {
            String originalName = StringUtils.cleanPath(
                    file.getOriginalFilename() != null ? file.getOriginalFilename() : "exhibit");
            String extension = "";
            int dot = originalName.lastIndexOf('.');
            if (dot >= 0) extension = originalName.substring(dot + 1).toLowerCase();

            Path dir = Paths.get("uploads", "cases", String.valueOf(id), "exhibits")
                    .toAbsolutePath().normalize();
            Files.createDirectories(dir);
            String storedName = UUID.randomUUID() + "_" + originalName.replace(" ", "_");
            Path destination = dir.resolve(storedName);
            Files.copy(file.getInputStream(), destination, StandardCopyOption.REPLACE_EXISTING);

            long count = caseExhibitRepository
                    .findByCaseStudyIdOrderByDisplayOrderAsc(id).size();

            CaseExhibit exhibit = CaseExhibit.builder()
                    .caseStudy(caseStudy)
                    .title(title.trim())
                    .description(description != null ? description.trim() : null)
                    .filePath(destination.toString())
                    .originalFileName(originalName)
                    .fileType(extension)
                    .displayOrder((int) count + 1)
                    .build();

            CaseExhibit saved = caseExhibitRepository.save(exhibit);

            return ResponseEntity.ok(CaseExhibitDTO.builder()
                    .id(saved.getId())
                    .title(saved.getTitle())
                    .description(saved.getDescription())
                    .originalFileName(saved.getOriginalFileName())
                    .fileType(saved.getFileType())
                    .displayOrder(saved.getDisplayOrder())
                    .build());
        } catch (IOException ex) {
            throw new RuntimeException("Failed to store exhibit file", ex);
        }
    }

    @GetMapping("/{id}/exhibits/{exhibitId}")
    @PreAuthorize("hasAnyRole('ADMIN','FACULTY','STUDENT')")
    @Operation(summary = "Download case exhibit")
    public ResponseEntity<Resource> downloadExhibit(
            @PathVariable Long id,
            @PathVariable Long exhibitId) {

        CaseExhibit exhibit = caseExhibitRepository.findById(exhibitId)
                .orElseThrow(() -> new ResourceNotFoundException("Exhibit not found"));

        if (!exhibit.getCaseStudy().getId().equals(id)) {
            return ResponseEntity.notFound().build();
        }
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        boolean isStudent = auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_STUDENT"));
        if (isStudent && exhibit.getCaseStudy().getStatus() != CaseStatus.PUBLISHED) {
            return ResponseEntity.notFound().build();
        }

        try {
            Path filePath = Paths.get(exhibit.getFilePath()).normalize();
            Resource resource = new UrlResource(filePath.toUri());
            if (!resource.exists() || !resource.isReadable()) {
                return ResponseEntity.notFound().build();
            }
            String contentType = determineContentType(exhibit.getFileType());
            return ResponseEntity.ok()
                    .contentType(MediaType.parseMediaType(contentType))
                    .header(HttpHeaders.CONTENT_DISPOSITION,
                            "attachment; filename=\"" + exhibit.getOriginalFileName() + "\"")
                    .body(resource);
        } catch (Exception ex) {
            throw new RuntimeException("Failed to serve exhibit", ex);
        }
    }

    @DeleteMapping("/{id}/exhibits/{exhibitId}")
    @PreAuthorize("hasAnyRole('ADMIN','FACULTY')")
    @Operation(summary = "Delete case exhibit")
    public ResponseEntity<Void> deleteExhibit(
            @PathVariable Long id,
            @PathVariable Long exhibitId) {

        CaseStudy caseStudy = caseStudyRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Case not found with id: " + id));

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        boolean isAdmin = auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        if (!isAdmin) {
            String email = auth.getName();
            User faculty = userRepository.findByEmail(email)
                    .orElseThrow(() -> new ResourceNotFoundException("User not found"));
            if (caseStudy.getCreatedBy() == null ||
                    !caseStudy.getCreatedBy().getId().equals(faculty.getId())) {
                throw new AccessDeniedException("You can only delete exhibits from your own cases");
            }
        }

        CaseExhibit exhibit = caseExhibitRepository.findById(exhibitId)
                .orElseThrow(() -> new ResourceNotFoundException("Exhibit not found"));
        if (!exhibit.getCaseStudy().getId().equals(id)) {
            return ResponseEntity.notFound().build();
        }

        if (exhibit.getFilePath() != null) {
            try {
                Files.deleteIfExists(Paths.get(exhibit.getFilePath()));
            } catch (IOException ex) {
                log.warn("Could not delete exhibit file: {}", exhibit.getFilePath());
            }
        }
        caseExhibitRepository.delete(exhibit);
        return ResponseEntity.noContent().build();
    }

    private String determineContentType(String extension) {
        if (extension == null) return "application/octet-stream";
        return switch (extension.toLowerCase()) {
            case "pdf" -> "application/pdf";
            case "png" -> "image/png";
            case "jpg", "jpeg" -> "image/jpeg";
            case "xlsx" -> "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
            case "xls" -> "application/vnd.ms-excel";
            case "csv" -> "text/csv";
            case "zip" -> "application/zip";
            default -> "application/octet-stream";
        };
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
            String storedFileName = UUID.randomUUID() + "_" + originalFilename.replace(" ", "_");
            return storageService.store(
                    caseMaterial.getInputStream(),
                    "uploads/case-materials",
                    storedFileName,
                    caseMaterial.getContentType()
            );
        } catch (IOException ex) {
            throw new RuntimeException("Failed to store case material file", ex);
        }
    }
}
