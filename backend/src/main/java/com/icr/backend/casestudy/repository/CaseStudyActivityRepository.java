package com.icr.backend.casestudy.repository;

import com.icr.backend.casestudy.entity.CaseStudyActivity;
import com.icr.backend.casestudy.enums.ActivityEvent;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CaseStudyActivityRepository extends JpaRepository<CaseStudyActivity, Long> {

    List<CaseStudyActivity> findByStudentIdAndCaseStudyIdOrderByTimestampAsc(Long studentId, Long caseStudyId);

    List<CaseStudyActivity> findByStudentId(Long studentId);

    boolean existsByStudentIdAndCaseStudyIdAndEvent(Long studentId, Long caseStudyId, ActivityEvent event);
}
