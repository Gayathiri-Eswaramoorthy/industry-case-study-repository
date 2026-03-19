package com.icr.backend.casestudy.repository;

import com.icr.backend.casestudy.entity.CaseCoMapping;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

public interface CaseCoMappingRepository extends JpaRepository<CaseCoMapping, Long> {

    Optional<CaseCoMapping> findByCaseStudyIdAndCourseOutcomeId(Long caseId, Long coId);

    List<CaseCoMapping> findByCaseStudyId(Long caseId);

    List<CaseCoMapping> findByCaseStudyIdIn(List<Long> caseIds);

    List<CaseCoMapping> findByCourseOutcomeId(Long coId);

    @Modifying
    @Transactional
    void deleteAllByCaseStudyId(Long caseId);
}
