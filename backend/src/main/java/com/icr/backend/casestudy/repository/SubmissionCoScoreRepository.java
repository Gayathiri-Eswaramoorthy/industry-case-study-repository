package com.icr.backend.casestudy.repository;

import com.icr.backend.casestudy.entity.SubmissionCoScore;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

public interface SubmissionCoScoreRepository extends JpaRepository<SubmissionCoScore, Long> {

    List<SubmissionCoScore> findBySubmissionId(Long submissionId);

    @Modifying
    @Transactional
    void deleteBySubmissionId(Long submissionId);
}
