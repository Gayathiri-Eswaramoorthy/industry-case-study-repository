package com.icr.backend.casestudy.repository;

import com.icr.backend.casestudy.entity.SubmissionGroup;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface SubmissionGroupRepository extends JpaRepository<SubmissionGroup, Long> {

    List<SubmissionGroup> findByCaseStudyId(Long caseId);

    Optional<SubmissionGroup> findById(Long id);
}
