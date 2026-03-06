package com.icr.backend.casestudy.repository;

import com.icr.backend.casestudy.entity.CaseCoMapping;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface CaseCoMappingRepository extends JpaRepository<CaseCoMapping, Long> {

    Optional<CaseCoMapping> findByCaseStudyIdAndCourseOutcomeId(Long caseId, Long coId);

    List<CaseCoMapping> findByCaseStudyId(Long caseId);

    List<CaseCoMapping> findByCourseOutcomeId(Long coId);
}