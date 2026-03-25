package com.icr.backend.casestudy.repository;

import com.icr.backend.casestudy.entity.CasePeerReview;
import com.icr.backend.casestudy.enums.PeerReviewStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface CasePeerReviewRepository extends JpaRepository<CasePeerReview, Long> {

    List<CasePeerReview> findByReviewerId(Long reviewerId);

    List<CasePeerReview> findByCaseStudyId(Long caseId);

    Optional<CasePeerReview> findByCaseStudyIdAndReviewerId(Long caseId, Long reviewerId);

    boolean existsByCaseStudyIdAndReviewerIdAndStatusNot(Long caseId, Long reviewerId, PeerReviewStatus status);
}
