package com.icr.backend.casestudy.repository;

import com.icr.backend.casestudy.entity.CaseExhibit;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CaseExhibitRepository extends JpaRepository<CaseExhibit, Long> {
    List<CaseExhibit> findByCaseStudyIdOrderByDisplayOrderAsc(Long caseId);
    void deleteAllByCaseStudyId(Long caseId);
}
