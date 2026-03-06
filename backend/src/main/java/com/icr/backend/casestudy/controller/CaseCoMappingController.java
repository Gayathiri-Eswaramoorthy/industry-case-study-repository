package com.icr.backend.casestudy.controller;

import com.icr.backend.casestudy.service.CaseCoMappingService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/case-co")
@RequiredArgsConstructor
public class CaseCoMappingController {

    private final CaseCoMappingService caseCoMappingService;

    // Map Case → CO (Admin / Faculty)
    @PostMapping("/map")
    @PreAuthorize("hasAnyRole('ADMIN','FACULTY')")
    public String mapCaseToCo(@RequestParam Long caseId,
                              @RequestParam Long coId) {

        caseCoMappingService.mapCaseToCo(caseId, coId);
        return "Case mapped to CO successfully";
    }

    // Get CO IDs for a Case
    @GetMapping("/{caseId}")
    @PreAuthorize("hasAnyRole('ADMIN','FACULTY','STUDENT')")
    public List<Long> getCoIdsForCase(@PathVariable Long caseId) {

        return caseCoMappingService.getCoIdsForCase(caseId);
    }
}