package com.icr.backend.casestudy.repository;

import com.icr.backend.casestudy.entity.SubmissionCoScore;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface SubmissionCoScoreRepository extends JpaRepository<SubmissionCoScore, Long> {

    List<SubmissionCoScore> findBySubmissionId(Long submissionId);

    void deleteBySubmissionId(Long submissionId);
}
