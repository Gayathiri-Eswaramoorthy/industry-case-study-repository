package com.icr.backend.casestudy.repository;

import com.icr.backend.casestudy.entity.CaseStudy;
import com.icr.backend.casestudy.entity.CaseTag;
import com.icr.backend.casestudy.enums.CaseCategory;
import com.icr.backend.casestudy.enums.DifficultyLevel;
import com.icr.backend.enums.CaseStatus;
import jakarta.persistence.criteria.Predicate;
import jakarta.persistence.criteria.Root;
import jakarta.persistence.criteria.Subquery;
import org.springframework.data.jpa.domain.Specification;

import java.util.ArrayList;
import java.util.List;

public class CaseStudySpecification {

    private CaseStudySpecification() {
    }

    public static Specification<CaseStudy> build(
            String q,
            CaseStatus status,
            CaseCategory category,
            DifficultyLevel difficulty,
            List<String> tags,
            Integer minYear,
            Integer maxYear,
            Long facultyId,
            boolean studentView
    ) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (studentView) {
                predicates.add(cb.equal(root.get("status"), CaseStatus.PUBLISHED));
            } else if (facultyId != null) {
                Predicate published = cb.equal(root.get("status"), CaseStatus.PUBLISHED);
                Predicate ownDraft = cb.and(
                        cb.equal(root.get("status"), CaseStatus.DRAFT),
                        cb.equal(root.get("createdBy").get("id"), facultyId)
                );
                predicates.add(cb.or(published, ownDraft));
            }

            if (status != null && !studentView) {
                predicates.add(cb.equal(root.get("status"), status));
            }

            if (q != null && !q.isBlank()) {
                String pattern = "%" + q.trim().toLowerCase() + "%";
                Predicate titleMatch = cb.like(cb.lower(root.get("title")), pattern);
                Predicate descMatch = cb.like(cb.lower(root.get("description")), pattern);
                predicates.add(cb.or(titleMatch, descMatch));
            }

            if (category != null) {
                predicates.add(cb.equal(root.get("category"), category));
            }

            if (difficulty != null) {
                predicates.add(cb.equal(root.get("difficulty"), difficulty));
            }

            if (minYear != null) {
                predicates.add(cb.greaterThanOrEqualTo(
                        cb.function("YEAR", Integer.class, root.get("createdAt")), minYear));
            }
            if (maxYear != null) {
                predicates.add(cb.lessThanOrEqualTo(
                        cb.function("YEAR", Integer.class, root.get("createdAt")), maxYear));
            }

            if (tags != null && !tags.isEmpty()) {
                Subquery<Long> tagSubquery = query.subquery(Long.class);
                Root<CaseTag> tagRoot = tagSubquery.from(CaseTag.class);
                tagSubquery.select(tagRoot.get("caseStudy").get("id"))
                        .where(
                                cb.equal(tagRoot.get("caseStudy").get("id"), root.get("id")),
                                tagRoot.get("tag").in(tags)
                        );
                predicates.add(cb.exists(tagSubquery));
            }

            query.distinct(true);
            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}
