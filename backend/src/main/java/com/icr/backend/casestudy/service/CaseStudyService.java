package com.icr.backend.casestudy.service;

import com.icr.backend.casestudy.dto.CaseStudyRequest;
import com.icr.backend.casestudy.dto.CaseStudyResponse;
import com.icr.backend.casestudy.dto.UpdateCaseStudyRequest;
import com.icr.backend.enums.CaseStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface CaseStudyService {

    CaseStudyResponse createCase(CaseStudyRequest request);

    default Page<CaseStudyResponse> getAllCases(Pageable pageable) {
        return getAllCases(null, pageable);
    }

    Page<CaseStudyResponse> getAllCases(CaseStatus status, Pageable pageable);

    Page<CaseStudyResponse> searchCases(
            String q,
            CaseStatus status,
            String category,
            String difficulty,
            List<String> tags,
            Integer minYear,
            Integer maxYear,
            String sortParam,
            Pageable pageable
    );

    Page<CaseStudyResponse> getCasesByCourse(Long courseId, CaseStatus status, Pageable pageable);

    List<CaseStudyResponse> getCasesByCourseAndStatus(Long courseId, CaseStatus status);

    List<CaseStudyResponse> getPublishedCasesByCourse(Long courseId);

    CaseStudyResponse getCaseById(Long id);

    List<CaseStudyResponse> getRelatedCases(Long id);

    CaseStudyResponse publishCase(Long caseId);

    CaseStudyResponse archiveCase(Long caseId);

    CaseStudyResponse updateCaseStatus(Long caseId, CaseStatus status);

    CaseStudyResponse updateCase(Long caseId, UpdateCaseStudyRequest request);

    void deleteCase(Long caseId);
}
