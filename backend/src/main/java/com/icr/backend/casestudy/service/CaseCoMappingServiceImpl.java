package com.icr.backend.casestudy.service;

import com.icr.backend.casestudy.entity.CaseCoMapping;
import com.icr.backend.casestudy.entity.CaseStudy;
import com.icr.backend.casestudy.repository.CaseCoMappingRepository;
import com.icr.backend.casestudy.repository.CaseStudyRepository;
import com.icr.backend.outcome.entity.CourseOutcome;
import com.icr.backend.outcome.repository.CourseOutcomeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CaseCoMappingServiceImpl implements CaseCoMappingService {

    private final CaseCoMappingRepository caseCoMappingRepository;
    private final CaseStudyRepository caseStudyRepository;
    private final CourseOutcomeRepository courseOutcomeRepository;

    @Override
    public void mapCaseToCo(Long caseId, Long coId) {

        if (caseCoMappingRepository
                .findByCaseStudyIdAndCourseOutcomeId(caseId, coId)
                .isPresent()) {
            throw new RuntimeException("Mapping already exists");
        }

        CaseStudy caseStudy = caseStudyRepository.findById(caseId)
                .orElseThrow(() -> new RuntimeException("Case not found"));

        CourseOutcome courseOutcome = courseOutcomeRepository.findById(coId)
                .orElseThrow(() -> new RuntimeException("Course Outcome not found"));

        CaseCoMapping mapping = CaseCoMapping.builder()
                .caseStudy(caseStudy)
                .courseOutcome(courseOutcome)
                .mappedAt(LocalDateTime.now())
                .build();

        caseCoMappingRepository.save(mapping);
    }

    @Override
    public List<Long> getCoIdsForCase(Long caseId) {

        return caseCoMappingRepository.findByCaseStudyId(caseId)
                .stream()
                .map(mapping -> mapping.getCourseOutcome().getId())
                .collect(Collectors.toList());
    }
}