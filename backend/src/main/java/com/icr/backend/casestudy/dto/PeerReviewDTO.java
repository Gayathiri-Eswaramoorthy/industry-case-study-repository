package com.icr.backend.casestudy.dto;

import com.icr.backend.casestudy.enums.PeerReviewStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PeerReviewDTO {

    private Long id;
    private Long caseId;
    private String caseTitle;
    private Long requestedById;
    private String requestedByName;
    private Long reviewerId;
    private String reviewerName;
    private PeerReviewStatus status;
    private String feedback;
    private Integer rating;
    private LocalDateTime requestedAt;
    private LocalDateTime completedAt;
}
