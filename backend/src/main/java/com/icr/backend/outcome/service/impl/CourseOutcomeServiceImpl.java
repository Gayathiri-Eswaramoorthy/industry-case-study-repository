package com.icr.backend.outcome.service.impl;

import com.icr.backend.course.entity.Course;
import com.icr.backend.course.repository.CourseRepository;
import com.icr.backend.exception.DuplicateResourceException;
import com.icr.backend.exception.ResourceNotFoundException;
import com.icr.backend.outcome.dto.CourseOutcomeRequest;
import com.icr.backend.outcome.dto.CourseOutcomeResponse;
import com.icr.backend.outcome.entity.CourseOutcome;
import com.icr.backend.outcome.repository.CourseOutcomeRepository;
import com.icr.backend.outcome.service.CoPoMappingService;
import com.icr.backend.outcome.service.CourseOutcomeService;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CourseOutcomeServiceImpl implements CourseOutcomeService {

    private final CourseOutcomeRepository courseOutcomeRepository;
    private final CourseRepository courseRepository;
    private final CoPoMappingService coPoMappingService;

    @Override
    @Transactional
    public CourseOutcomeResponse createCourseOutcome(CourseOutcomeRequest request) {

        if (request == null || request.getCourseId() == null) {
            throw new IllegalArgumentException("Course id is required");
        }

        if (request.getCode() == null || request.getCode().isBlank()) {
            throw new IllegalArgumentException("Course outcome code is required");
        }

        if (courseOutcomeRepository.existsByCodeAndCourseId(request.getCode(), request.getCourseId())) {
            throw new DuplicateResourceException("Course Outcome with this code already exists for the selected course");
        }

        Course course = courseRepository.findById(request.getCourseId())
                .orElseThrow(() -> new ResourceNotFoundException("Course not found with id: " + request.getCourseId()));

        CourseOutcome outcome = CourseOutcome.builder()
                .code(request.getCode())
                .description(request.getDescription())
                .course(course)
                .build();

        CourseOutcome saved = courseOutcomeRepository.save(outcome);

        return mapToResponse(saved);
    }

    @Override
    @Transactional
    public List<CourseOutcomeResponse> getCourseOutcomesByCourse(Long courseId) {

        if (!courseRepository.existsById(courseId)) {
            throw new ResourceNotFoundException("Course not found with id: " + courseId);
        }

        return courseOutcomeRepository.findByCourseId(courseId)
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Override
    @Transactional
    public List<CourseOutcomeResponse> getAllCourseOutcomes() {
        return courseOutcomeRepository.findAll()
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    private CourseOutcomeResponse mapToResponse(CourseOutcome outcome) {
        return CourseOutcomeResponse.builder()
                .id(outcome.getId())
                .code(outcome.getCode())
                .description(outcome.getDescription())
                .courseId(outcome.getCourse().getId())
                .mappedPoIds(coPoMappingService.getPoIdsForCo(outcome.getId()))
                .build();
    }
}
