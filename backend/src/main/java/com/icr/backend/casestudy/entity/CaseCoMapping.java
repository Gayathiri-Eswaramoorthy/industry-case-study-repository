package com.icr.backend.casestudy.entity;

import com.icr.backend.outcome.entity.CourseOutcome;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "case_co_mapping",
        uniqueConstraints = {
                @UniqueConstraint(columnNames = {"case_id", "co_id"})
        })
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CaseCoMapping {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Case reference
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "case_id", nullable = false)
    private CaseStudy caseStudy;

    // CO reference
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "co_id", nullable = false)
    private CourseOutcome courseOutcome;

    private LocalDateTime mappedAt;
}