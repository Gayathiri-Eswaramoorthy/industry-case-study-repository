package com.icr.backend.casestudy.repository;

import com.icr.backend.casestudy.entity.CaseAssignment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CaseAssignmentRepository extends JpaRepository<CaseAssignment, Long> {

    List<CaseAssignment> findByCaseStudyId(Long caseId);

    List<CaseAssignment> findByFacultyId(Long facultyId);

    boolean existsByCaseStudyId(Long caseId);

    boolean existsByCaseStudyIdAndFacultyId(Long caseId, Long facultyId);

    void deleteAllByCaseStudyId(Long caseId);
}
