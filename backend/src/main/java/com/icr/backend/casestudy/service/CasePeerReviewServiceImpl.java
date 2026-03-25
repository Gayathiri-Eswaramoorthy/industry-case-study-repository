package com.icr.backend.casestudy.service;

import com.icr.backend.casestudy.dto.CompletePeerReviewRequest;
import com.icr.backend.casestudy.dto.PeerReviewDTO;
import com.icr.backend.casestudy.dto.RequestPeerReviewRequest;
import com.icr.backend.casestudy.entity.CasePeerReview;
import com.icr.backend.casestudy.entity.CaseStudy;
import com.icr.backend.casestudy.enums.PeerReviewStatus;
import com.icr.backend.casestudy.repository.CasePeerReviewRepository;
import com.icr.backend.casestudy.repository.CaseStudyRepository;
import com.icr.backend.entity.User;
import com.icr.backend.enums.CaseStatus;
import com.icr.backend.enums.RoleType;
import com.icr.backend.exception.DuplicateResourceException;
import com.icr.backend.exception.ResourceNotFoundException;
import com.icr.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class CasePeerReviewServiceImpl implements CasePeerReviewService {

    private final CasePeerReviewRepository casePeerReviewRepository;
    private final CaseStudyRepository caseStudyRepository;
    private final UserRepository userRepository;

    @Override
    @Transactional
    public PeerReviewDTO requestReview(Long caseId, RequestPeerReviewRequest request) {
        User requester = getAuthenticatedFaculty();
        CaseStudy caseStudy = caseStudyRepository.findById(caseId)
                .orElseThrow(() -> new ResourceNotFoundException("Case not found with id: " + caseId));

        if (caseStudy.getStatus() != CaseStatus.DRAFT) {
            throw new IllegalArgumentException("Peer review can only be requested for draft cases");
        }
        if (caseStudy.getCreatedBy() == null || !requester.getId().equals(caseStudy.getCreatedBy().getId())) {
            throw new AccessDeniedException("You can request review only for your own draft case");
        }
        if (request == null || request.getReviewerFacultyId() == null) {
            throw new IllegalArgumentException("reviewerFacultyId is required");
        }

        User reviewer = userRepository.findById(request.getReviewerFacultyId())
                .orElseThrow(() -> new ResourceNotFoundException("Reviewer not found with id: " + request.getReviewerFacultyId()));
        if (reviewer.getRole() == null || reviewer.getRole().getName() != RoleType.FACULTY) {
            throw new IllegalArgumentException("Reviewer must be a faculty member");
        }
        if (reviewer.getId().equals(requester.getId())) {
            throw new IllegalArgumentException("You cannot request peer review from yourself");
        }
        if (casePeerReviewRepository.existsByCaseStudyIdAndReviewerIdAndStatusNot(
                caseId, reviewer.getId(), PeerReviewStatus.DECLINED
        )) {
            throw new DuplicateResourceException("An active peer review request already exists for this reviewer");
        }

        CasePeerReview saved = casePeerReviewRepository.save(
                CasePeerReview.builder()
                        .caseStudy(caseStudy)
                        .requestedBy(requester)
                        .reviewer(reviewer)
                        .status(PeerReviewStatus.PENDING)
                        .build()
        );
        return mapToDTO(saved);
    }

    @Override
    @Transactional
    public PeerReviewDTO acceptReview(Long caseId, Long reviewId) {
        User reviewer = getAuthenticatedFaculty();
        CasePeerReview review = getReviewForCase(reviewId, caseId);
        validateReviewer(review, reviewer);
        if (review.getStatus() != PeerReviewStatus.PENDING) {
            throw new IllegalArgumentException("Only pending reviews can be accepted");
        }

        review.setStatus(PeerReviewStatus.ACCEPTED);
        return mapToDTO(casePeerReviewRepository.save(review));
    }

    @Override
    @Transactional
    public PeerReviewDTO completeReview(Long caseId, Long reviewId, CompletePeerReviewRequest request) {
        User reviewer = getAuthenticatedFaculty();
        CasePeerReview review = getReviewForCase(reviewId, caseId);
        validateReviewer(review, reviewer);
        if (review.getStatus() != PeerReviewStatus.ACCEPTED) {
            throw new IllegalArgumentException("Only accepted reviews can be completed");
        }
        if (request == null || request.getRating() == null || request.getRating() < 1 || request.getRating() > 5) {
            throw new IllegalArgumentException("Rating must be between 1 and 5");
        }

        review.setFeedback(request.getFeedback());
        review.setRating(request.getRating());
        review.setStatus(PeerReviewStatus.COMPLETED);
        review.setCompletedAt(LocalDateTime.now());
        return mapToDTO(casePeerReviewRepository.save(review));
    }

    @Override
    @Transactional
    public PeerReviewDTO declineReview(Long caseId, Long reviewId) {
        User reviewer = getAuthenticatedFaculty();
        CasePeerReview review = getReviewForCase(reviewId, caseId);
        validateReviewer(review, reviewer);

        review.setStatus(PeerReviewStatus.DECLINED);
        return mapToDTO(casePeerReviewRepository.save(review));
    }

    @Override
    @Transactional(readOnly = true)
    public List<PeerReviewDTO> getMyPendingReviews() {
        User reviewer = getAuthenticatedFaculty();
        return casePeerReviewRepository.findByReviewerId(reviewer.getId()).stream()
                .sorted(Comparator.comparing(CasePeerReview::getRequestedAt, Comparator.nullsLast(Comparator.reverseOrder())))
                .map(this::mapToDTO)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<PeerReviewDTO> getReviewsForCase(Long caseId) {
        CaseStudy caseStudy = caseStudyRepository.findById(caseId)
                .orElseThrow(() -> new ResourceNotFoundException("Case not found with id: " + caseId));

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        boolean isAdmin = auth != null && auth.getAuthorities().stream()
                .anyMatch(a -> "ROLE_ADMIN".equals(a.getAuthority()));
        if (!isAdmin) {
            User requester = getAuthenticatedFaculty();
            if (caseStudy.getCreatedBy() == null || !requester.getId().equals(caseStudy.getCreatedBy().getId())) {
                throw new AccessDeniedException("Only case creator can view peer reviews for this case");
            }
        }

        return casePeerReviewRepository.findByCaseStudyId(caseId).stream()
                .sorted(Comparator.comparing(CasePeerReview::getRequestedAt, Comparator.nullsLast(Comparator.reverseOrder())))
                .map(this::mapToDTO)
                .toList();
    }

    private CasePeerReview getReviewForCase(Long reviewId, Long caseId) {
        CasePeerReview review = casePeerReviewRepository.findById(reviewId)
                .orElseThrow(() -> new ResourceNotFoundException("Peer review not found with id: " + reviewId));
        if (review.getCaseStudy() == null || !review.getCaseStudy().getId().equals(caseId)) {
            throw new ResourceNotFoundException("Peer review not found for case id: " + caseId);
        }
        return review;
    }

    private void validateReviewer(CasePeerReview review, User reviewer) {
        if (review.getReviewer() == null || !review.getReviewer().getId().equals(reviewer.getId())) {
            throw new AccessDeniedException("You are not the assigned reviewer for this request");
        }
    }

    private User getAuthenticatedFaculty() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || auth.getName() == null) {
            throw new AccessDeniedException("User not authenticated");
        }
        User user = userRepository.findByEmail(auth.getName())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        if (user.getRole() == null || user.getRole().getName() != RoleType.FACULTY) {
            throw new AccessDeniedException("Only faculty users can access this operation");
        }
        return user;
    }

    private PeerReviewDTO mapToDTO(CasePeerReview review) {
        return PeerReviewDTO.builder()
                .id(review.getId())
                .caseId(review.getCaseStudy() != null ? review.getCaseStudy().getId() : null)
                .caseTitle(review.getCaseStudy() != null ? review.getCaseStudy().getTitle() : null)
                .requestedById(review.getRequestedBy() != null ? review.getRequestedBy().getId() : null)
                .requestedByName(review.getRequestedBy() != null ? review.getRequestedBy().getFullName() : null)
                .reviewerId(review.getReviewer() != null ? review.getReviewer().getId() : null)
                .reviewerName(review.getReviewer() != null ? review.getReviewer().getFullName() : null)
                .status(review.getStatus())
                .feedback(review.getFeedback())
                .rating(review.getRating())
                .requestedAt(review.getRequestedAt())
                .completedAt(review.getCompletedAt())
                .build();
    }
}
