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

    @Column(nullable = false)
    @Builder.Default
    private boolean groupSubmissionEnabled = false;

    @Column
    private Integer maxGroupSize;

    @Column(name = "case_material_path")
    private String caseMaterialPath;

    @Column(name = "case_document_path")
    private String caseDocumentPath;

    @Column(name = "case_document_original_name")
    private String caseDocumentOriginalName;

    @Column(name = "company_name")
    private String companyName;

    @Column(name = "real_company_name")
    private String realCompanyName;

    @Column(name = "is_disguised")
    @Builder.Default
    private boolean isDisguised = false;

    @Column(name = "industry")
    private String industry;

    @Column(name = "geographic_region")
    private String geographicRegion;

    @Column(name = "protagonist_role")
    private String protagonistRole;

    @Column(name = "publication_year")
    private Integer publicationYear;

    @Column(name = "source_attribution", length = 500)
    private String sourceAttribution;

    @Column(name = "case_narrative", columnDefinition = "LONGTEXT")
    private String caseNarrative;

    @Column(name = "company_background", columnDefinition = "TEXT")
    private String companyBackground;

    @Column(name = "industry_context", columnDefinition = "TEXT")
    private String industryContext;

    @Column(name = "decision_point", columnDefinition = "TEXT")
    private String decisionPoint;

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

    @Column(name = "teaching_notes_path")
    private String teachingNotesPath;

    @Column(name = "teaching_notes_original_name")
    private String teachingNotesOriginalName;

    @Column(name = "teaching_notes_text", columnDefinition = "LONGTEXT")
    private String teachingNotesText;

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
