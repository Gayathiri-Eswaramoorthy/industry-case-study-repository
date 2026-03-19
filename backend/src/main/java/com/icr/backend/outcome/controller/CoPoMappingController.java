package com.icr.backend.outcome.controller;

import com.icr.backend.dto.response.ApiResponse;
import com.icr.backend.outcome.dto.CoPoMappingRequest;
import com.icr.backend.outcome.dto.CoPoMappingUpdateRequest;
import com.icr.backend.outcome.service.CoPoMappingService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/co-po-mapping")
@RequiredArgsConstructor
public class CoPoMappingController {

    private final CoPoMappingService coPoMappingService;

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<Void> mapCoToPo(@RequestBody CoPoMappingRequest request) {
        coPoMappingService.mapCoToPo(request.getCoId(), request.getPoId());

        return ApiResponse.<Void>builder()
                .success(true)
                .message("CO mapped to PO successfully")
                .data(null)
                .timestamp(LocalDateTime.now())
                .build();
    }

    @GetMapping("/{coId}")
    @PreAuthorize("hasAnyRole('ADMIN','FACULTY','STUDENT')")
    public ApiResponse<List<Long>> getPoIdsForCo(@PathVariable Long coId) {
        return ApiResponse.<List<Long>>builder()
                .success(true)
                .message("PO mappings fetched successfully")
                .data(coPoMappingService.getPoIdsForCo(coId))
                .timestamp(LocalDateTime.now())
                .build();
    }

    @PutMapping("/{coId}")
    @PreAuthorize("hasRole('ADMIN')")
    @Transactional
    public ApiResponse<Void> updatePoMappingsForCo(
            @PathVariable Long coId,
            @RequestBody CoPoMappingUpdateRequest request
    ) {
        coPoMappingService.updatePoMappingsForCo(coId, request.getPoIds());

        return ApiResponse.<Void>builder()
                .success(true)
                .message("PO mappings updated successfully")
                .data(null)
                .timestamp(LocalDateTime.now())
                .build();
    }
}
