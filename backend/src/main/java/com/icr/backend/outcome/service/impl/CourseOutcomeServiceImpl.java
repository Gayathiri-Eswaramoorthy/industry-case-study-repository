package com.icr.backend.outcome.service.impl;

import com.icr.backend.course.entity.Course;
import com.icr.backend.course.repository.CourseRepository;
import com.icr.backend.outcome.dto.CourseOutcomeResponse;
import com.icr.backend.outcome.entity.CourseOutcome;
import com.icr.backend.outcome.repository.CourseOutcomeRepository;
import com.icr.backend.outcome.service.CourseOutcomeService;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CourseOutcomeServiceImpl implements CourseOutcomeService {

    private final CourseOutcomeRepository courseOutcomeRepository;
    private final CourseRepository courseRepository;

    @Override
    @Transactional
    public CourseOutcomeResponse createCourseOutcome(String code, String description, Long courseId) {

        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new RuntimeException("Course not found"));

        CourseOutcome outcome = CourseOutcome.builder()
                .code(code)
                .description(description)
                .course(course)
                .build();

        CourseOutcome saved = courseOutcomeRepository.save(outcome);

        return mapToResponse(saved);
    }

    @Override
    @Transactional
    public List<CourseOutcomeResponse> getCourseOutcomesByCourse(Long courseId) {

        if (!courseRepository.existsById(courseId)) {
            throw new RuntimeException("Course not found");
        }

        return courseOutcomeRepository.findByCourseId(courseId)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    private CourseOutcomeResponse mapToResponse(CourseOutcome outcome) {
        return CourseOutcomeResponse.builder()
                .id(outcome.getId())
                .code(outcome.getCode())
                .description(outcome.getDescription())
                .courseId(outcome.getCourse().getId())
                .build();
    }
}