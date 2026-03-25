package com.icr.backend.casestudy.repository;

import com.icr.backend.casestudy.entity.CaseDiscussionQuestion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CaseDiscussionQuestionRepository extends JpaRepository<CaseDiscussionQuestion, Long> {

    List<CaseDiscussionQuestion> findByCaseStudyIdOrderByQuestionOrderAsc(Long caseId);

    void deleteAllByCaseStudyId(Long caseId);

    boolean existsByCaseStudyId(Long caseId);
}
