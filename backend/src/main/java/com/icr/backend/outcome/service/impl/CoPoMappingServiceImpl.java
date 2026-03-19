package com.icr.backend.outcome.service.impl;

import com.icr.backend.exception.DuplicateResourceException;
import com.icr.backend.exception.ResourceNotFoundException;
import com.icr.backend.outcome.entity.CourseOutcome;
import com.icr.backend.outcome.entity.CourseOutcomePOMapping;
import com.icr.backend.outcome.entity.ProgramOutcome;
import com.icr.backend.outcome.repository.CourseOutcomePORepository;
import com.icr.backend.outcome.repository.CourseOutcomeRepository;
import com.icr.backend.outcome.repository.ProgramOutcomeRepository;
import com.icr.backend.outcome.service.CoPoMappingService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Objects;

@Service
@RequiredArgsConstructor
public class CoPoMappingServiceImpl implements CoPoMappingService {

    private final CourseOutcomePORepository courseOutcomePORepository;
    private final CourseOutcomeRepository courseOutcomeRepository;
    private final ProgramOutcomeRepository programOutcomeRepository;

    @Override
    @Transactional
    public void mapCoToPo(Long coId, Long poId) {
        if (courseOutcomePORepository.existsByCourseOutcomeIdAndProgramOutcomeId(coId, poId)) {
            throw new DuplicateResourceException("CO to PO mapping already exists");
        }

        CourseOutcome courseOutcome = courseOutcomeRepository.findById(coId)
                .orElseThrow(() -> new ResourceNotFoundException("Course Outcome not found with id: " + coId));
        ProgramOutcome programOutcome = programOutcomeRepository.findById(poId)
                .orElseThrow(() -> new ResourceNotFoundException("Program Outcome not found with id: " + poId));

        courseOutcomePORepository.save(
                CourseOutcomePOMapping.builder()
                        .courseOutcome(courseOutcome)
                        .programOutcome(programOutcome)
                        .build()
        );
    }

    @Override
    public List<Long> getPoIdsForCo(Long coId) {
        return courseOutcomePORepository.findByCourseOutcomeId(coId).stream()
                .map(mapping -> mapping.getProgramOutcome().getId())
                .toList();
    }

    @Override
    @Transactional
    public void updatePoMappingsForCo(Long coId, List<Long> poIds) {
        if (!courseOutcomeRepository.existsById(coId)) {
            throw new ResourceNotFoundException("Course Outcome not found with id: " + coId);
        }

        courseOutcomePORepository.deleteAllByCourseOutcomeId(coId);

        if (poIds == null || poIds.isEmpty()) {
            return;
        }

        poIds.stream()
                .filter(Objects::nonNull)
                .distinct()
                .forEach(poId -> mapCoToPo(coId, poId));
    }
}
