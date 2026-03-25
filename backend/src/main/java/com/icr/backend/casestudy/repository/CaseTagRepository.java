package com.icr.backend.casestudy.repository;

import com.icr.backend.casestudy.entity.CaseTag;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CaseTagRepository extends JpaRepository<CaseTag, Long> {
    List<CaseTag> findByCaseStudyId(Long caseId);

    void deleteAllByCaseStudyId(Long caseId);

    @Query("SELECT DISTINCT t.tag FROM CaseTag t ORDER BY t.tag ASC")
    List<String> findDistinctTagValues();
}
