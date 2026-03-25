package com.icr.backend.casestudy.service;

import com.icr.backend.casestudy.dto.CompletePeerReviewRequest;
import com.icr.backend.casestudy.dto.PeerReviewDTO;
import com.icr.backend.casestudy.dto.RequestPeerReviewRequest;

import java.util.List;

public interface CasePeerReviewService {

    PeerReviewDTO requestReview(Long caseId, RequestPeerReviewRequest request);

    PeerReviewDTO acceptReview(Long caseId, Long reviewId);

    PeerReviewDTO completeReview(Long caseId, Long reviewId, CompletePeerReviewRequest request);

    PeerReviewDTO declineReview(Long caseId, Long reviewId);

    List<PeerReviewDTO> getMyPendingReviews();

    List<PeerReviewDTO> getReviewsForCase(Long caseId);
}
