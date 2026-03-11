package com.icr.backend.casestudy.service;

import com.icr.backend.casestudy.dto.CaseStudyRequest;
import com.icr.backend.casestudy.dto.CaseStudyResponse;
import com.icr.backend.casestudy.dto.UpdateCaseStudyRequest;
import com.icr.backend.enums.CaseStatus;

import java.util.List;

public interface CaseStudyService {

    CaseStudyResponse createCase(CaseStudyRequest request);

    List<CaseStudyResponse> getCasesByCourse(Long courseId, CaseStatus status);

    List<CaseStudyResponse> getCasesByCourseAndStatus(Long courseId, CaseStatus status);

    List<CaseStudyResponse> getPublishedCasesByCourse(Long courseId);

    CaseStudyResponse getCaseById(Long id);

    CaseStudyResponse publishCase(Long caseId);

    CaseStudyResponse updateCaseStatus(Long caseId, CaseStatus status);

    CaseStudyResponse updateCase(Long caseId, UpdateCaseStudyRequest request);
}
