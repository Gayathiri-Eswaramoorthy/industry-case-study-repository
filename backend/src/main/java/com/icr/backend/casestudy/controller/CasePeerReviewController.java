package com.icr.backend.casestudy.controller;

import com.icr.backend.casestudy.dto.CompletePeerReviewRequest;
import com.icr.backend.casestudy.dto.PeerReviewDTO;
import com.icr.backend.casestudy.dto.RequestPeerReviewRequest;
import com.icr.backend.casestudy.service.CasePeerReviewService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class CasePeerReviewController {

    private final CasePeerReviewService casePeerReviewService;

    @PostMapping("/cases/{id}/peer-review/request")
    @PreAuthorize("hasRole('FACULTY')")
    public PeerReviewDTO requestReview(
            @PathVariable("id") Long caseId,
            @RequestBody RequestPeerReviewRequest request
    ) {
        return casePeerReviewService.requestReview(caseId, request);
    }

    @PutMapping("/cases/{id}/peer-review/{reviewId}/accept")
    @PreAuthorize("hasRole('FACULTY')")
    public PeerReviewDTO acceptReview(
            @PathVariable("id") Long caseId,
            @PathVariable Long reviewId
    ) {
        return casePeerReviewService.acceptReview(caseId, reviewId);
    }

    @PutMapping("/cases/{id}/peer-review/{reviewId}/complete")
    @PreAuthorize("hasRole('FACULTY')")
    public PeerReviewDTO completeReview(
            @PathVariable("id") Long caseId,
            @PathVariable Long reviewId,
            @Valid @RequestBody CompletePeerReviewRequest request
    ) {
        return casePeerReviewService.completeReview(caseId, reviewId, request);
    }

    @PutMapping("/cases/{id}/peer-review/{reviewId}/decline")
    @PreAuthorize("hasRole('FACULTY')")
    public PeerReviewDTO declineReview(
            @PathVariable("id") Long caseId,
            @PathVariable Long reviewId
    ) {
        return casePeerReviewService.declineReview(caseId, reviewId);
    }

    @GetMapping("/faculty/peer-reviews")
    @PreAuthorize("hasRole('FACULTY')")
    public List<PeerReviewDTO> getMyPeerReviews() {
        return casePeerReviewService.getMyPendingReviews();
    }

    @GetMapping("/cases/{id}/peer-reviews")
    @PreAuthorize("hasAnyRole('FACULTY','ADMIN')")
    public List<PeerReviewDTO> getReviewsForCase(@PathVariable("id") Long caseId) {
        return casePeerReviewService.getReviewsForCase(caseId);
    }
}
