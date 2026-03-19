package com.icr.backend.casestudy.entity;

import com.icr.backend.casestudy.enums.DifficultyLevel;
import com.icr.backend.casestudy.enums.CaseCategory;
import com.icr.backend.casestudy.enums.SubmissionType;
import com.icr.backend.course.entity.Course;
import com.icr.backend.entity.User;
import com.icr.backend.enums.CaseStatus;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "case_studies")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CaseStudy {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, columnDefinition = "VARCHAR(20)")
    private DifficultyLevel difficulty;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private CaseStatus status = CaseStatus.DRAFT;

    @Column
    private LocalDateTime dueDate;

    @Column
    private Integer maxMarks;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, columnDefinition = "VARCHAR(50)")
    @Builder.Default
    private CaseCategory category = CaseCategory.PRODUCT;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, columnDefinition = "VARCHAR(20)")
    @Builder.Default
    private SubmissionType submissionType = SubmissionType.TEXT;

    @Column(name = "case_material_path")
    private String caseMaterialPath;

    @Column(columnDefinition = "TEXT")
    private String problemStatement;

    @Column(columnDefinition = "TEXT")
    private String keyQuestions;

    @Column(columnDefinition = "TEXT")
    private String evaluationRubric;

    @Column(columnDefinition = "TEXT")
    private String constraints;

    @Column(columnDefinition = "TEXT")
    private String expectedOutcome;

    private String referenceLinks;

    private Integer estimatedHours;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "course_id", nullable = false)
    private Course course;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by", nullable = false)
    private User createdBy;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        if (this.status == null) {
            this.status = CaseStatus.DRAFT;
        }
        if (this.category == null) {
            this.category = CaseCategory.PRODUCT;
        }
        if (this.submissionType == null) {
            this.submissionType = SubmissionType.TEXT;
        }
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
